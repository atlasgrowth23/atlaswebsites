// Script to run HVAC tables migration
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function runHVACMigration() {
  if (!process.env.DIRECT_URL) {
    throw new Error('DIRECT_URL missing in .env.local');
  }

  const client = await pool.connect();
  
  try {
    console.log('🚀 Running HVAC tables migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250618_001_create_hvac_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await client.query(migrationSQL);
    
    console.log('✓ HVAC tables created successfully!');
    console.log('✓ Tables created:');
    console.log('  - hvac_contacts');
    console.log('  - hvac_contact_activities'); 
    console.log('  - hvac_conversations');
    console.log('  - hvac_messages');
    console.log('✓ Indexes and RLS policies created');
    console.log('✓ Triggers for auto-updates created');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runHVACMigration().catch(error => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});