const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function createAdminTables() {
  if (!process.env.DIRECT_URL) {
    throw new Error('DIRECT_URL missing in .env.local');
  }
  
  const client = await pool.connect();
  
  try {
    console.log('🚀 Creating admin messaging tables...');
    
    // Create admin_threads table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_threads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subject TEXT,
        company_id UUID,
        shared BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    console.log('✓ admin_threads table created');
    
    // Create admin_messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        thread_id UUID REFERENCES admin_threads(id) ON DELETE CASCADE,
        kind TEXT CHECK (kind IN ('email','note')),
        author_id UUID REFERENCES auth.users(id),
        gmail_thread_id TEXT,
        body_html TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        is_starred BOOLEAN DEFAULT FALSE
      );
    `);
    
    console.log('✓ admin_messages table created');
    
    // Create admin_user_tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_user_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id),
        provider TEXT DEFAULT 'google',
        refresh_token TEXT,
        access_token TEXT,
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    console.log('✓ admin_user_tokens table created');
    
    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_admin_messages_thread_id ON admin_messages(thread_id);
      CREATE INDEX IF NOT EXISTS idx_admin_messages_author_id ON admin_messages(author_id);
      CREATE INDEX IF NOT EXISTS idx_admin_messages_created_at ON admin_messages(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_admin_threads_company_id ON admin_threads(company_id);
      CREATE INDEX IF NOT EXISTS idx_admin_user_tokens_user_id ON admin_user_tokens(user_id);
    `);
    
    console.log('✓ Indexes created');
    
    // Enable RLS on admin tables
    await client.query(`
      ALTER TABLE admin_threads ENABLE ROW LEVEL SECURITY;
      ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;
      ALTER TABLE admin_user_tokens ENABLE ROW LEVEL SECURITY;
    `);
    
    console.log('✓ RLS enabled');
    
    // Create RLS policies for admin_messages (author or super_admin)
    await client.query(`
      DROP POLICY IF EXISTS "author_or_super_admin_messages" ON admin_messages;
      CREATE POLICY "author_or_super_admin_messages" ON admin_messages
        FOR ALL USING (
          author_id = auth.uid() OR 
          (auth.jwt() ->> 'role') = 'super_admin'
        );
    `);
    
    // Create RLS policies for admin_threads (shared or super_admin)
    await client.query(`
      DROP POLICY IF EXISTS "shared_or_super_admin_threads" ON admin_threads;
      CREATE POLICY "shared_or_super_admin_threads" ON admin_threads
        FOR ALL USING (
          shared = TRUE OR 
          (auth.jwt() ->> 'role') = 'super_admin'
        );
    `);
    
    // Create RLS policies for admin_user_tokens (own tokens or super_admin)
    await client.query(`
      DROP POLICY IF EXISTS "own_tokens_or_super_admin" ON admin_user_tokens;
      CREATE POLICY "own_tokens_or_super_admin" ON admin_user_tokens
        FOR ALL USING (
          user_id = auth.uid() OR 
          (auth.jwt() ->> 'role') = 'super_admin'
        );
    `);
    
    console.log('✓ RLS policies created');
    
    console.log('🎉 Admin tables setup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createAdminTables().catch(error => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});