const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupAdminUsers() {
  const client = await pool.connect();
  
  try {
    console.log('🔐 SETTING UP ADMIN USERS SYSTEM');
    console.log('='.repeat(50));
    
    // 1. Create admin_users table
    console.log('\n📋 Creating admin_users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email text UNIQUE NOT NULL,
        name text NOT NULL,
        role text NOT NULL DEFAULT 'admin',
        is_active boolean DEFAULT true,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      )
    `);
    console.log('   ✅ admin_users table created');
    
    // 2. Insert Nick and Jared
    console.log('\n👥 Adding admin users...');
    
    // Nick (SuperAdmin)
    await client.query(`
      INSERT INTO admin_users (email, name, role) 
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        updated_at = now()
    `, ['nicholas@atlasgrowth.ai', 'Nick', 'superadmin']);
    console.log('   ✅ Nick added as SuperAdmin');
    
    // Jared (Admin)  
    await client.query(`
      INSERT INTO admin_users (email, name, role) 
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        updated_at = now()
    `, ['jared@atlasgrowth.ai', 'Jared', 'admin']);
    console.log('   ✅ Jared added as Admin');
    
    // 3. Show current admin users
    console.log('\n📊 Current admin users:');
    const users = await client.query(`
      SELECT email, name, role, created_at 
      FROM admin_users 
      ORDER BY role DESC, name
    `);
    
    users.rows.forEach(user => {
      console.log(`   ${user.role.toUpperCase()}: ${user.name} (${user.email})`);
    });
    
    // 4. Create role permissions reference
    console.log('\n🔑 ROLE PERMISSIONS:');
    console.log('   📋 SuperAdmin (Nick):');
    console.log('      - Full database access');
    console.log('      - User management');
    console.log('      - System configuration');
    console.log('      - All pipeline operations');
    console.log('');
    console.log('   📋 Admin (Jared):');
    console.log('      - Pipeline management');
    console.log('      - Lead operations');
    console.log('      - Activity tracking');
    console.log('      - Analytics access');
    
    console.log('\n✅ ADMIN USER SYSTEM SETUP COMPLETE!');
    console.log('\n🎯 NEXT STEPS:');
    console.log('   1. Update LeadSidebar to use real user authentication');
    console.log('   2. Replace hardcoded usernames in activity tracking');
    console.log('   3. Add login system to admin panel');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

setupAdminUsers();