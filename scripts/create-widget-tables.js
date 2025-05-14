require('dotenv').config();
const { Pool } = require('pg');

// Create database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Execute a query with error handling
 */
async function query(text, params = []) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Creates the necessary tables for widget tracking
 */
async function createWidgetTables() {
  console.log('Creating widget tracking tables...');

  // Create widget_views table
  await query(`
    CREATE TABLE IF NOT EXISTS widget_views (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL,
      viewed_at TIMESTAMPTZ NOT NULL,
      referrer TEXT,
      CONSTRAINT fk_company
        FOREIGN KEY(company_id)
        REFERENCES companies(id)
        ON DELETE CASCADE
    )
  `);
  console.log('Created widget_views table');

  // Create widget_settings table for customization
  await query(`
    CREATE TABLE IF NOT EXISTS widget_settings (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL UNIQUE,
      enabled BOOLEAN DEFAULT TRUE,
      primary_color VARCHAR(50) DEFAULT '#0066FF',
      accent_color VARCHAR(50) DEFAULT '#F6AD55',
      title VARCHAR(255) DEFAULT 'How can we help you?',
      buttons JSONB DEFAULT '[
        {"id": "service", "label": "Schedule Service", "description": "Request a service appointment"},
        {"id": "quote", "label": "Free Quote", "description": "Get a free estimate for installation"},
        {"id": "emergency", "label": "Emergency", "description": "Need help right away?"},
        {"id": "question", "label": "Ask a Question", "description": "Get answers from our experts"}
      ]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT fk_company
        FOREIGN KEY(company_id)
        REFERENCES companies(id)
        ON DELETE CASCADE
    )
  `);
  console.log('Created widget_settings table');

  // Add index for faster lookups
  await query(`
    CREATE INDEX IF NOT EXISTS idx_widget_views_company 
    ON widget_views(company_id)
  `);
  
  await query(`
    CREATE INDEX IF NOT EXISTS idx_widget_views_date 
    ON widget_views(viewed_at)
  `);
  
  console.log('Added indexes for widget tables');
}

/**
 * Main function
 */
async function main() {
  try {
    await createWidgetTables();
    console.log('Successfully created widget tables');
  } catch (error) {
    console.error('Error creating widget tables:', error);
  } finally {
    // Close pool
    await pool.end();
  }
}

// Run the script
main();