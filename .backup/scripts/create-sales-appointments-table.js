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
 * Creates the appointment table for sales management
 */
async function createAppointmentsTable() {
  try {
    console.log('Creating sales_appointments table...');
    
    // Create sales_appointments table
    await query(`
      CREATE TABLE IF NOT EXISTS sales_appointments (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES sales_leads(id) ON DELETE CASCADE,
        appointment_date TIMESTAMPTZ NOT NULL,
        title TEXT,
        notes TEXT,
        created_by INTEGER REFERENCES sales_users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        appointment_type TEXT,
        status TEXT DEFAULT 'scheduled',
        outcome TEXT,
        google_calendar_id TEXT,
        conference_link TEXT
      );
    `);
    
    console.log('Sales appointments table created!');
    
    // Check if we have sample data - add one sample appointment if no data exists
    const count = await query('SELECT COUNT(*) FROM sales_appointments');
    
    if (parseInt(count.rows[0].count) === 0) {
      console.log('Adding a sample appointment for testing...');
      
      // Get a valid lead_id
      const leadsResult = await query('SELECT id FROM sales_leads LIMIT 1');
      if (leadsResult.rows.length > 0) {
        const leadId = leadsResult.rows[0].id;
        
        // Get a valid admin user
        const userResult = await query('SELECT id FROM sales_users WHERE is_admin = true LIMIT 1');
        if (userResult.rows.length > 0) {
          const userId = userResult.rows[0].id;
          
          // Create a sample appointment for tomorrow
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(10, 0, 0, 0);
          
          await query(`
            INSERT INTO sales_appointments (
              lead_id, 
              appointment_date, 
              title, 
              notes, 
              created_by, 
              appointment_type
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            leadId, 
            tomorrow.toISOString(), 
            'Initial Consultation', 
            'Discuss preliminary needs and potential solutions.', 
            userId, 
            'Sales Meeting'
          ]);
          
          console.log('Sample appointment created!');
        }
      }
    }

  } catch (error) {
    console.error('Error creating sales appointments table:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    await createAppointmentsTable();
    console.log('All done!');
  } catch (error) {
    console.error('Script failed:', error);
  } finally {
    await pool.end();
  }
}

main();