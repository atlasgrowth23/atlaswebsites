const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createAdminSessionsTable() {
  if (!process.env.DIRECT_URL && !process.env.DATABASE_URL) {
    throw new Error('DIRECT_URL or DATABASE_URL missing in .env.local');
  }
  
  const client = await pool.connect();
  
  try {
    console.log('🚀 Creating admin_sessions table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_sessions (
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
      );
    `);
    console.log('✓ admin_sessions table created');
    
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_sessions_token 
      ON admin_sessions(session_token);
    `);
    console.log('✓ Index on session_token created');
    
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_sessions_email 
      ON admin_sessions(email);
    `);
    console.log('✓ Index on email created');
    
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_sessions_expires_at 
      ON admin_sessions(expires_at);
    `);
    console.log('✓ Index on expires_at created');
    
    console.log('🎉 Admin sessions table setup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createAdminSessionsTable().catch(error => {
  console.error('Table creation failed:', error.message);
  process.exit(1);
});