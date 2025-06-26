const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkCompanies() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking companies in database...\n');
    
    // Check if companies table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'companies'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Companies table does not exist');
      return;
    }
    
    // First, check what columns exist in companies table
    const columnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'companies'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Companies table columns:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    console.log('');
    
    // Get all companies 
    const companiesResult = await client.query(`
      SELECT * FROM companies LIMIT 10
    `);
    
    if (companiesResult.rows.length === 0) {
      console.log('❌ No companies found');
      console.log('\n💡 You may need to run a setup script to create test companies');
      return;
    }
    
    console.log(`✅ Found ${companiesResult.rows.length} companies:\n`);
    
    companiesResult.rows.forEach((company, index) => {
      console.log(`${index + 1}. Company data:`, JSON.stringify(company, null, 2));
      console.log('');
    });
    
    // Also check total count of all companies
    const totalResult = await client.query('SELECT COUNT(*) as total FROM companies');
    console.log(`📊 Total companies in database: ${totalResult.rows[0].total}`);
    
  } catch (error) {
    console.error('❌ Error checking companies:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkCompanies();