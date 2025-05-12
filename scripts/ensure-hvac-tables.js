const { Pool } = require('pg');

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for some PostgreSQL providers
  }
});

async function query(text, params) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

async function ensureHvacTables() {
  try {
    console.log('Ensuring HVAC tables exist...');

    // Create contacts table
    await query(`
      CREATE TABLE IF NOT EXISTS hvac_contacts (
        id SERIAL PRIMARY KEY,
        company_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(50),
        zip VARCHAR(20),
        type VARCHAR(50) DEFAULT 'residential',
        notes TEXT,
        last_service_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      )
    `);
    console.log('- Verified hvac_contacts table');

    console.log('HVAC tables check completed!');
  } catch (error) {
    console.error('Error ensuring HVAC tables:', error);
    throw error;
  }
}

async function main() {
  try {
    await ensureHvacTables();
    console.log('All done!');
  } catch (error) {
    console.error('Error in main function:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
main();