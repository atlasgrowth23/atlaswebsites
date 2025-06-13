const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function cleanupOldAuthSystem() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Cleaning up old authentication system...\n');
    
    // Check what tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('admin_users', 'admin_tokens', 'sessions', 'accounts', 'users', 'verification_tokens')
      ORDER BY table_name
    `);
    
    console.log('📋 Found these auth-related tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    if (tablesResult.rows.length === 0) {
      console.log('✅ No auth tables found to clean up');
      return;
    }
    
    // Backup current admin users before deletion
    try {
      const adminUsers = await client.query('SELECT email, role FROM admin_users');
      console.log('\n💾 Backing up admin users:');
      adminUsers.rows.forEach(user => {
        console.log(`  - ${user.email} (${user.role})`);
      });
    } catch (error) {
      console.log('ℹ️ No admin_users table found');
    }
    
    // Drop all auth-related tables
    const tablesToDrop = tablesResult.rows.map(row => row.table_name);
    
    for (const tableName of tablesToDrop) {
      try {
        await client.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
        console.log(`✅ Dropped table: ${tableName}`);
      } catch (error) {
        console.log(`⚠️ Could not drop ${tableName}: ${error.message}`);
      }
    }
    
    // Create new simple admin session table for Google OAuth
    console.log('\n🏗️ Creating new admin_sessions table...');
    await client.query(`
      CREATE TABLE admin_sessions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT,
        role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin')),
        google_access_token TEXT NOT NULL,
        google_refresh_token TEXT NOT NULL,
        google_token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        google_scopes TEXT[] DEFAULT ARRAY[
          'https://www.googleapis.com/auth/contacts',
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/gmail.send'
        ],
        session_token TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    console.log('✅ Created admin_sessions table');
    
    // Create index for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
      CREATE INDEX IF NOT EXISTS idx_admin_sessions_email ON admin_sessions(email);
    `);
    
    console.log('✅ Created indexes for admin_sessions');
    
    // Show the new table structure
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'admin_sessions' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 New admin_sessions table structure:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'required'})`);
    });
    
    console.log('\n🎉 Database cleanup complete!');
    console.log('📝 Next: Implement Google OAuth flow');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanupOldAuthSystem().catch(console.error);