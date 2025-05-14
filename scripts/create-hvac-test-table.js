// Script to create a test table for HVAC portal redesign
require('dotenv').config(); // Load environment variables from .env file
const { Pool } = require('pg');

async function createHvacTestTable() {
  // Check if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    return;
  }

  console.log('Connecting to database:', process.env.DATABASE_URL.split('@')[1]); // Log partial URL for security
  
  // Create a PostgreSQL connection pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for Neon PostgreSQL
    }
  });

  try {
    console.log('Creating hvac_test table...');
    
    // Create the test table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hvac_test (
        id SERIAL PRIMARY KEY,
        test_column TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('hvac_test table created successfully!');
    
    // Insert a test record
    await pool.query(`
      INSERT INTO hvac_test (test_column) 
      VALUES ('This is a test');
    `);
    
    console.log('Test record inserted successfully!');
    
    // Verify the table by querying it
    const result = await pool.query('SELECT * FROM hvac_test');
    console.log('Table contents:', result.rows);
    
  } catch (error) {
    console.error('Error creating hvac_test table:', error);
  } finally {
    // Close the pool
    await pool.end();
    console.log('Database connection closed');
  }
}

// Run the function
createHvacTestTable();