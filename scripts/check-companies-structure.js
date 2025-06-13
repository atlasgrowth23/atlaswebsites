const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkTableStructures() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking database table structures...\n');
    
    // Check companies table structure
    console.log('📋 COMPANIES TABLE COLUMNS:');
    const companiesColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'companies' 
      ORDER BY ordinal_position;
    `);
    
    companiesColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check business_owners table structure
    console.log('\n📋 BUSINESS_OWNERS TABLE COLUMNS:');
    const businessOwnersColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'business_owners' 
      ORDER BY ordinal_position;
    `);
    
    if (businessOwnersColumns.rows.length === 0) {
      console.log('  ❌ business_owners table does not exist');
    } else {
      businessOwnersColumns.rows.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    }
    
    // Check sample data
    console.log('\n📊 COMPANIES TABLE SAMPLE DATA:');
    const companiesSample = await client.query('SELECT * FROM companies LIMIT 3;');
    companiesSample.rows.forEach((row, i) => {
      console.log(`  Company ${i+1}: ${row.name} - ${row.city}, ${row.state}`);
      console.log(`    Phone: ${row.phone || 'NULL'}, Email: ${row.email_1 || 'NULL'}`);
    });
    
    if (businessOwnersColumns.rows.length > 0) {
      console.log('\n📊 BUSINESS_OWNERS TABLE SAMPLE DATA:');
      const ownersSample = await client.query('SELECT * FROM business_owners LIMIT 3;');
      ownersSample.rows.forEach((row, i) => {
        console.log(`  Owner ${i+1}: ${JSON.stringify(row)}`);
      });
    }
    
    // Check if there are any relationships
    console.log('\n🔗 CHECKING RELATIONSHIPS:');
    if (businessOwnersColumns.rows.length > 0) {
      const relationshipCheck = await client.query(`
        SELECT COUNT(*) as total_owners,
               COUNT(DISTINCT company_id) as companies_with_owners
        FROM business_owners;
      `);
      console.log(`  - Total owners: ${relationshipCheck.rows[0].total_owners}`);
      console.log(`  - Companies with owners: ${relationshipCheck.rows[0].companies_with_owners}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTableStructures().catch(console.error);