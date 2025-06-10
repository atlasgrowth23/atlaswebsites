const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function addAdminRoles() {
  if (!process.env.DIRECT_URL) {
    throw new Error('DIRECT_URL missing in .env.local');
  }
  
  const client = await pool.connect();
  
  try {
    console.log('🚀 Adding role column to auth.users...');
    
    // Add role column to auth.users table
    await client.query(`
      ALTER TABLE auth.users 
      ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';
    `);
    
    console.log('✓ Role column added');
    
    // Update Nicholas to super_admin role
    console.log('🔧 Setting Nicholas as super_admin...');
    await client.query(`
      UPDATE auth.users 
      SET role = 'super_admin' 
      WHERE email = 'nicholas@atlasgrowth.ai';
    `);
    
    console.log('✓ Nicholas set as super_admin');
    
    // Update any other existing users to admin role
    console.log('🔧 Setting other users as admin...');
    await client.query(`
      UPDATE auth.users 
      SET role = 'admin' 
      WHERE role IS NULL OR role = '';
    `);
    
    console.log('✓ Other users set as admin');
    
    // Check results
    const result = await client.query(`
      SELECT email, role FROM auth.users ORDER BY created_at;
    `);
    
    console.log('📊 Current user roles:');
    result.rows.forEach(row => {
      console.log(`  ${row.email}: ${row.role}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addAdminRoles().catch(error => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});