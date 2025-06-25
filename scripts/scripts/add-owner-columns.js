const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function addOwnerColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Adding owner columns to companies table...');
    
    // Add owner columns to companies table
    await client.query(`
      ALTER TABLE companies 
      ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS owner_email VARCHAR(255);
    `);
    
    console.log('✅ Added owner_name and owner_email columns to companies table');
    
    // Migrate existing data from business_owners to companies
    console.log('📋 Migrating existing owner data...');
    
    const migrateResult = await client.query(`
      UPDATE companies 
      SET 
        owner_name = bo.name,
        owner_email = bo.email
      FROM business_owners bo 
      WHERE companies.id = bo.company_id 
      AND bo.is_active = true;
    `);
    
    console.log(`✅ Migrated ${migrateResult.rowCount} owner records to companies table`);
    
    // Show sample results
    console.log('\n📊 SAMPLE COMPANIES WITH OWNER DATA:');
    const sample = await client.query(`
      SELECT name, city, state, owner_name, owner_email 
      FROM companies 
      WHERE owner_name IS NOT NULL 
      LIMIT 5;
    `);
    
    sample.rows.forEach(row => {
      console.log(`  ${row.name} (${row.city}, ${row.state})`);
      console.log(`    Owner: ${row.owner_name} - ${row.owner_email}`);
    });
    
    console.log('\n🗑️  Ready to delete business_owners table? (You can keep it for now)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

addOwnerColumns().catch(console.error);