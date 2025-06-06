const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function addOwnerNameField() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Adding owner_name field to lead_pipeline table...');
    
    // Add owner_name column
    await client.query(`
      ALTER TABLE lead_pipeline 
      ADD COLUMN IF NOT EXISTS owner_name TEXT;
    `);
    
    console.log('✅ Added owner_name field to lead_pipeline table');
    
    // Verify it was added
    const structure = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'lead_pipeline' AND column_name = 'owner_name';
    `);
    
    if (structure.rows.length > 0) {
      console.log('✅ Verified owner_name field exists:', structure.rows[0]);
    } else {
      console.log('❌ Failed to add owner_name field');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addOwnerNameField().catch(console.error);