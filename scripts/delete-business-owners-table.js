const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function deleteBusinessOwnersTable() {
  const client = await pool.connect();
  
  try {
    console.log('🗑️ Deleting business_owners table...');
    
    // First check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'business_owners'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      // Show what we're about to delete
      const countResult = await client.query('SELECT COUNT(*) FROM business_owners');
      console.log(`📊 Found ${countResult.rows[0].count} records in business_owners table`);
      
      // Delete the table
      await client.query('DROP TABLE IF EXISTS business_owners CASCADE;');
      console.log('✅ Successfully deleted business_owners table');
    } else {
      console.log('ℹ️ business_owners table does not exist');
    }
    
    // Also check for any other session-related tables
    console.log('\n🔍 Checking for other unused tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%session%' 
      OR table_name LIKE '%tk_contact%'
      ORDER BY table_name;
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('📋 Found these potentially unused tables:');
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    } else {
      console.log('✅ No other unused tables found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

deleteBusinessOwnersTable().catch(console.error);