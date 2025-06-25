// Run Phase 1 migrations for Atlas tenant system
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

async function runMigrations() {
  if (!process.env.DIRECT_URL) {
    throw new Error('DIRECT_URL missing in .env.local');
  }

  const client = await pool.connect();
  
  try {
    console.log('🚀 Running Phase 1 migrations...');
    
    // Read and run drop legacy migration
    const dropLegacySql = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/20250610_001_drop_legacy.sql'), 
      'utf8'
    );
    console.log('📤 Dropping legacy tables...');
    await client.query(dropLegacySql);
    console.log('✓ Legacy cleanup complete');
    
    // Read and run create tenants/contacts migration  
    const createTablesSql = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/20250610_002_create_tenants_and_contacts.sql'), 
      'utf8'
    );
    console.log('📦 Creating tenants and contacts tables...');
    await client.query(createTablesSql);
    console.log('✓ Tables created successfully');
    
    // Create a test tenant for development
    const testTenantResult = await client.query(`
      INSERT INTO tenants (business_name) 
      VALUES ('Dev Test HVAC Company') 
      RETURNING id
    `);
    const testTenantId = testTenantResult.rows[0].id;
    console.log(`✓ Test tenant created: ${testTenantId}`);
    
    // Create a few test contacts
    await client.query(`
      INSERT INTO contacts (tenant_id, first_name, last_name, phone, email, equip_type, model_number, install_date, filter_size, notes)
      VALUES 
        ($1, 'John', 'Smith', '205-555-0101', 'john@example.com', 'central_ac', 'TRANE-XR15', '2023-05-15', '16x25x1', 'Initial installation, customer prefers morning appointments'),
        ($1, 'Sarah', 'Johnson', '205-555-0102', 'sarah@example.com', 'heat_pump', 'CARRIER-25HCB4', '2022-08-20', '20x25x1', 'Regular maintenance customer, has two units'),
        ($1, 'Mike', 'Williams', '205-555-0103', 'mike@example.com', 'furnace', 'RHEEM-R95T', '2021-11-10', '16x20x1', 'Warranty expires soon, schedule inspection')
    `, [testTenantId]);
    console.log('✓ Test contacts created');
    
    console.log('\n🎉 Phase 1 migrations completed successfully!');
    console.log(`📝 Test tenant ID for development: ${testTenantId}`);
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(error => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});