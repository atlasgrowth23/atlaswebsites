const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function addGoogleOAuthColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adding Google OAuth columns to admin_users table...\n');
    
    // Add Google OAuth columns
    await client.query(`
      ALTER TABLE admin_users 
      ADD COLUMN IF NOT EXISTS google_access_token TEXT,
      ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
      ADD COLUMN IF NOT EXISTS google_token_expires_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS google_authorized BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS google_scopes TEXT[] DEFAULT ARRAY['https://www.googleapis.com/auth/contacts', 'https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/gmail.send']
    `);
    
    console.log('✅ Added Google OAuth columns to admin_users table');
    
    // Check the updated table structure
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'admin_users' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Updated admin_users table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    // Show current users
    const users = await client.query('SELECT email, role, google_authorized FROM admin_users');
    console.log('\n👥 Current admin users:');
    users.rows.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - Google: ${user.google_authorized ? '✅' : '❌'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

addGoogleOAuthColumns().catch(console.error);