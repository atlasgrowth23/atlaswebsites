const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createAdminUsersTable() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Creating admin_users table...');
    
    // Create the table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    console.log('✅ Created admin_users table');
    
    // Hash the passwords
    const nicholasHash = await bcrypt.hash('Matheos23$', 12);
    const jaredHash = await bcrypt.hash('Jtimmyt1$', 12);
    
    // Insert the admin users
    await client.query(`
      INSERT INTO admin_users (email, password_hash, role) VALUES
      ('nicholas@atlasgrowth.ai', $1, 'super_admin'),
      ('jared@atlasgrowth.ai', $2, 'admin')
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        updated_at = NOW();
    `, [nicholasHash, jaredHash]);
    
    console.log('✅ Inserted admin users with bcrypt hashed passwords');
    
    // Show the users
    const result = await client.query('SELECT email, role, is_active, created_at FROM admin_users ORDER BY created_at;');
    console.log('\n👥 Admin users created:');
    result.rows.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - Active: ${user.is_active}`);
    });
    
    console.log('\n🔐 Passwords are securely hashed with bcrypt');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createAdminUsersTable().catch(console.error);