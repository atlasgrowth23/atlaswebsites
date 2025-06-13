const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function cleanupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Cleaning up unnecessary tables and users...');
    
    // Delete unnecessary admin tables
    console.log('\n🗑️ Deleting admin tables...');
    await client.query(`
      DROP TABLE IF EXISTS admin_profiles CASCADE;
      DROP TABLE IF EXISTS admin_threads CASCADE; 
      DROP TABLE IF EXISTS admin_user_tokens CASCADE;
      DROP TABLE IF EXISTS cold_call_sessions CASCADE;
    `);
    console.log('✅ Deleted admin tables');
    
    // Delete all users from auth.users since we're using hardcoded auth now
    console.log('\n👥 Deleting all users from auth.users...');
    try {
      const deleteResult = await client.query('DELETE FROM auth.users;');
      console.log(`✅ Deleted ${deleteResult.rowCount} users from auth.users`);
    } catch (error) {
      console.log('ℹ️ Could not delete from auth.users (permission denied or table protected)');
    }
    
    // Check what's left
    console.log('\n📋 Remaining tables:');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    console.log('\n✅ Database cleanup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanupDatabase().catch(console.error);