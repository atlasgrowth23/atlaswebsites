// Add lat/lng columns to contacts table
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

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Adding lat/lng columns to contacts...');
    
    const migrationSql = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/20250610_003_add_address_lat_lng.sql'), 
      'utf8'
    );
    
    await client.query(migrationSql);
    console.log('✓ Lat/lng columns added successfully');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(error => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});