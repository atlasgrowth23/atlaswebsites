const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

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
 * Creates the sales activities table if it doesn't exist
 */
async function createSalesActivitiesTable() {
  try {
    console.log('Checking if sales_activities table exists...');
    
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'sales_activities'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('Creating sales_activities table...');
      
      await query(`
        CREATE TABLE sales_activities (
          id SERIAL PRIMARY KEY,
          lead_id INTEGER REFERENCES sales_leads(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          created_by INTEGER REFERENCES sales_users(id)
        );
      `);
      
      console.log('Sales activities table created successfully!');
    } else {
      console.log('Sales activities table already exists.');
    }
  } catch (error) {
    console.error('Error creating sales activities table:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    await createSalesActivitiesTable();
    console.log('All done!');
  } catch (error) {
    console.error('Script failed:', error);
  } finally {
    await pool.end();
  }
}

main();