const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixAdminTokensConstraint() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing admin_user_tokens unique constraint...');
    
    // First check if table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'admin_user_tokens'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('📋 Creating admin_user_tokens table...');
      await client.query(`
        CREATE TABLE admin_user_tokens (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id),
          provider TEXT DEFAULT 'google',
          refresh_token TEXT,
          access_token TEXT,
          expires_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id, provider)
        );
      `);
      console.log('✅ Table created with unique constraint');
    } else {
      console.log('📋 Table exists, adding unique constraint...');
      
      // Try to add the constraint (will fail if it already exists)
      try {
        await client.query(`
          ALTER TABLE admin_user_tokens 
          ADD CONSTRAINT admin_user_tokens_user_provider_unique 
          UNIQUE (user_id, provider);
        `);
        console.log('✅ Unique constraint added');
      } catch (error) {
        if (error.code === '42P07') {
          console.log('✅ Unique constraint already exists');
        } else {
          throw error;
        }
      }
    }
    
    // Enable RLS if not already enabled
    await client.query(`
      ALTER TABLE admin_user_tokens ENABLE ROW LEVEL SECURITY;
    `);
    
    // Create RLS policy
    await client.query(`
      DROP POLICY IF EXISTS "own_tokens_or_super_admin" ON admin_user_tokens;
      CREATE POLICY "own_tokens_or_super_admin" ON admin_user_tokens
        FOR ALL USING (
          user_id = auth.uid() OR 
          (auth.jwt() ->> 'role') = 'super_admin'
        );
    `);
    
    console.log('✅ RLS enabled and policy created');
    console.log('🎉 Admin tokens table fixed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixAdminTokensConstraint().catch(error => {
  console.error('Fix failed:', error.message);
  process.exit(1);
});