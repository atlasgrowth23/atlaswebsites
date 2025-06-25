// Cold Call System Migration
const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function runColdCallMigration() {
  if (!process.env.DIRECT_URL) {
    throw new Error('DIRECT_URL missing in env.local');
  }
  
  const client = await pool.connect();
  
  try {
    console.log('🚀 Running Cold Call System migration...');
    
    // 1. Create cold_call_sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cold_call_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_name VARCHAR(50) NOT NULL,
        start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        end_time TIMESTAMP WITH TIME ZONE,
        leads_processed INTEGER DEFAULT 0,
        calls_made INTEGER DEFAULT 0,
        contacts_made INTEGER DEFAULT 0,
        voicemails_left INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Created cold_call_sessions table');
    
    // 2. Create activity_log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES cold_call_sessions(id) ON DELETE SET NULL,
        lead_id UUID REFERENCES lead_pipeline(id) ON DELETE CASCADE,
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        user_name VARCHAR(50) NOT NULL,
        action VARCHAR(100) NOT NULL,
        action_data JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Created activity_log table');
    
    // 3. Create indexes for performance
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_log_session_id 
      ON activity_log(session_id);
    `);
    
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_log_lead_id 
      ON activity_log(lead_id);
    `);
    
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_log_user_name 
      ON activity_log(user_name);
    `);
    
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_log_created_at 
      ON activity_log(created_at DESC);
    `);
    
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cold_call_sessions_user_name 
      ON cold_call_sessions(user_name);
    `);
    console.log('✅ Created performance indexes');
    
    // 4. Migrate existing pipeline stages
    console.log('🔄 Migrating existing pipeline stages...');
    
    const migrationResult = await client.query(`
      UPDATE lead_pipeline 
      SET stage = CASE 
        WHEN stage = 'contacted' THEN 'new_lead'
        WHEN stage = 'voicemail_left' THEN 'new_lead'  
        WHEN stage = 'follow_up' THEN 'website_viewed'
        WHEN stage = 'not_interested' THEN 'unsuccessful_call'
        WHEN stage = 'appointment_scheduled' THEN 'appointment_scheduled'
        ELSE stage
      END
      WHERE stage IN ('contacted', 'voicemail_left', 'follow_up', 'not_interested')
      RETURNING id, stage;
    `);
    
    console.log(`✅ Migrated ${migrationResult.rowCount} pipeline records`);
    
    // 5. Add updated_at trigger for cold_call_sessions
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS update_cold_call_sessions_updated_at ON cold_call_sessions;
      CREATE TRIGGER update_cold_call_sessions_updated_at
        BEFORE UPDATE ON cold_call_sessions
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ Added auto-update trigger');
    
    console.log('🎉 Cold Call System migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runColdCallMigration().catch(error => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});