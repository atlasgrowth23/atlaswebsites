// Fix RLS policies for development deployment
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

if (!process.env.DIRECT_URL) {
  console.error('❌ DIRECT_URL missing in .env.local');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function runDevAuthFix() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Fixing dev authentication...');
    
    const migrationSql = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/20250610_004_fix_dev_auth.sql'), 
      'utf8'
    );
    
    await client.query(migrationSql);
    console.log('✓ Dev authentication fixed - RLS policies now allow public access');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runDevAuthFix().catch(error => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});