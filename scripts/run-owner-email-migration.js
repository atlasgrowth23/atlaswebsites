// Add owner_email column to lead_pipeline table
const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function runOwnerEmailMigration() {
  if (!process.env.DIRECT_URL) {
    throw new Error('DIRECT_URL missing in env.local');
  }
  
  const client = await pool.connect();
  
  try {
    console.log('🚀 Adding owner_email column to lead_pipeline...');
    
    // Add column
    await client.query(`
      ALTER TABLE lead_pipeline 
      ADD COLUMN IF NOT EXISTS owner_email VARCHAR(255);
    `);
    console.log('✅ Added owner_email column');
    
    // Create index
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lead_pipeline_owner_email 
      ON lead_pipeline(owner_email);
    `);
    console.log('✅ Created index on owner_email');
    
    // Backfill from tk_contacts
    const result = await client.query(`
      UPDATE lead_pipeline 
      SET owner_email = tk_contacts.owner_email
      FROM tk_contacts 
      WHERE lead_pipeline.company_id = tk_contacts.company_id 
      AND lead_pipeline.owner_email IS NULL 
      AND tk_contacts.owner_email IS NOT NULL;
    `);
    console.log(`✅ Backfilled ${result.rowCount} owner_email records from tk_contacts`);
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runOwnerEmailMigration().catch(error => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});