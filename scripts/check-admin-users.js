const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkAdminUsers() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking admin_users table...');
    
    // Check if table exists and get all users
    const result = await client.query('SELECT email, password_hash, role, is_active FROM admin_users;');
    
    if (result.rows.length === 0) {
      console.log('❌ No users found in admin_users table');
      return;
    }
    
    console.log(`\n👥 Found ${result.rows.length} users:`);
    result.rows.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} (${user.role}) - Active: ${user.is_active}`);
      console.log(`     Hash: ${user.password_hash.substring(0, 20)}...`);
    });
    
    // Test password verification for Nicholas
    const nicholasUser = result.rows.find(u => u.email === 'nicholas@atlasgrowth.ai');
    if (nicholasUser) {
      console.log('\n🔐 Testing password verification for Nicholas...');
      const isValid = await bcrypt.compare('Matheos23$', nicholasUser.password_hash);
      console.log(`Password check result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
      
      if (!isValid) {
        console.log('🔧 Regenerating password hash...');
        const newHash = await bcrypt.hash('Matheos23$', 12);
        await client.query(
          'UPDATE admin_users SET password_hash = $1 WHERE email = $2',
          [newHash, 'nicholas@atlasgrowth.ai']
        );
        console.log('✅ Updated Nicholas password hash');
      }
    }
    
    // Test for Jared too
    const jaredUser = result.rows.find(u => u.email === 'jared@atlasgrowth.ai');
    if (jaredUser) {
      console.log('\n🔐 Testing password verification for Jared...');
      const isValid = await bcrypt.compare('Jtimmyt1$', jaredUser.password_hash);
      console.log(`Password check result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
      
      if (!isValid) {
        console.log('🔧 Regenerating password hash...');
        const newHash = await bcrypt.hash('Jtimmyt1$', 12);
        await client.query(
          'UPDATE admin_users SET password_hash = $1 WHERE email = $2',
          [newHash, 'jared@atlasgrowth.ai']
        );
        console.log('✅ Updated Jared password hash');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAdminUsers().catch(console.error);