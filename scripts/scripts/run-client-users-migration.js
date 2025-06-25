// Run client users migration for Atlas Websites
const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function runClientUsersMigration() {
  if (!process.env.DIRECT_URL) {
    throw new Error('DIRECT_URL missing in env.local');
  }
  
  const client = await pool.connect();
  
  try {
    console.log('🚀 Running client users migration...');
    
    // Read and execute the migration file
    const fs = require('fs');
    const migrationSQL = fs.readFileSync('./supabase/migrations/20250607_002_create_client_users.sql', 'utf8');
    
    await client.query(migrationSQL);
    
    console.log('✓ Client users table created successfully');
    console.log('  - client_users table with company_id reference');
    console.log('  - get_or_create_client_user function');
    console.log('  - RLS policies for user data isolation');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runClientUsersMigration().catch(error => {
  console.error('Client users migration failed:', error.message);
  process.exit(1);
});