// Run chat system migration for Atlas Websites
const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function runChatMigration() {
  if (!process.env.DIRECT_URL) {
    throw new Error('DIRECT_URL missing in env.local');
  }
  
  const client = await pool.connect();
  
  try {
    console.log('🚀 Running chat system migration...');
    
    // Read and execute the migration file
    const fs = require('fs');
    const migrationSQL = fs.readFileSync('./supabase/migrations/20250607_001_create_chat_system.sql', 'utf8');
    
    await client.query(migrationSQL);
    
    console.log('✓ Chat system tables created successfully');
    console.log('  - contacts table with company_id, visitor_id, name, email/phone');
    console.log('  - conversations table for chat sessions');
    console.log('  - chat_messages table for individual messages');
    console.log('  - All indexes and RLS policies applied');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runChatMigration().catch(error => {
  console.error('Chat migration failed:', error.message);
  process.exit(1);
});