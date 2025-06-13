const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking all tables...');
    
    const result = await client.query(`
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📋 All tables in database:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check for auth-related tables specifically
    console.log('\n🔐 Auth/Admin related tables:');
    const authTables = result.rows.filter(row => 
      row.table_name.includes('admin') || 
      row.table_name.includes('auth') || 
      row.table_name.includes('user') || 
      row.table_name.includes('session') ||
      row.table_name.includes('message') ||
      row.table_name.includes('calendar') ||
      row.table_name.includes('invoice')
    );
    
    if (authTables.length === 0) {
      console.log('  ✅ No auth/admin tables found - good!');
    } else {
      authTables.forEach(row => {
        console.log(`  ⚠️  ${row.table_name}`);
      });
    }
    
    // Check users in auth.users
    console.log('\n👥 Checking auth.users table:');
    try {
      const users = await client.query('SELECT email, created_at FROM auth.users ORDER BY created_at;');
      if (users.rows.length === 0) {
        console.log('  ✅ No users in auth.users - good!');
      } else {
        console.log(`  ⚠️  Found ${users.rows.length} users:`);
        users.rows.forEach(user => {
          console.log(`    - ${user.email} (created: ${user.created_at})`);
        });
      }
    } catch (error) {
      console.log('  ℹ️  auth.users table not accessible or doesn\'t exist');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTables().catch(console.error);