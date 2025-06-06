const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkPipelineTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking pipeline-related tables...');
    
    // Check all tables that might contain pipeline data
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name LIKE '%lead%' 
        OR table_name LIKE '%pipeline%'
      ORDER BY table_name
    `);
    
    console.log('\n📋 Pipeline-related tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  ${row.table_name}`);
    });
    
    // Check if it's using a different naming scheme
    const allTablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 All tables:');
    allTablesResult.rows.forEach(row => {
      console.log(`  ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkPipelineTables().catch(console.error);