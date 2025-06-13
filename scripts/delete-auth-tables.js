const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function deleteAuthTables() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Deleting unnecessary auth/admin tables...');
    
    // Delete admin-related tables we no longer need
    await client.query(`
      DROP TABLE IF EXISTS admin_tokens CASCADE;
      DROP TABLE IF EXISTS admin_users CASCADE;
      DROP TABLE IF EXISTS admin_message_threads CASCADE;
      DROP TABLE IF EXISTS admin_messages CASCADE;
      DROP TABLE IF EXISTS google_tokens CASCADE;
    `);
    
    console.log('✓ Deleted unnecessary auth tables');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

deleteAuthTables().catch(console.error);