const { Client } = require('pg');
require('dotenv').config({ path: 'env.local' });

async function testConnections() {
  // First try DATABASE_URL (pooling connection)
  console.log('🔄 Testing DATABASE_URL (pooling connection)...');
  const poolingClient = new Client({
    connectionString: "postgresql://postgres.zjxvacezqbhyomrngynq:5T6oIAxMBoPFRRz2@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
  });

  try {
    await poolingClient.connect();
    console.log('✅ Pooling connection successful!');
    
    // Try to check tables
    const tablesResult = await poolingClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📋 Tables found:', tablesResult.rows.map(r => r.table_name));
    
    await poolingClient.end();
    
    // If pooling works, let's create tables with it
    return await createTablesWithPooling();
    
  } catch (error) {
    console.log('❌ Pooling connection failed:', error.message);
    await poolingClient.end();
  }

  // If pooling failed, try DIRECT_URL
  console.log('🔄 Testing DIRECT_URL (direct connection)...');
  const directClient = new Client({
    connectionString: "postgresql://postgres.zjxvacezqbhyomrngynq:5T6oIAxMBoPFRRz2@aws-0-us-east-2.pooler.supabase.com:5432/postgres"
  });

  try {
    await directClient.connect();
    console.log('✅ Direct connection successful!');
    
    // Try to check tables
    const tablesResult = await directClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📋 Tables found:', tablesResult.rows.map(r => r.table_name));
    
    await directClient.end();
    
    // If direct works, create tables with it
    return await createTablesWithDirect();
    
  } catch (error) {
    console.log('❌ Direct connection failed:', error.message);
    await directClient.end();
  }
}

async function createTablesWithPooling() {
  console.log('🚀 Creating tables with pooling connection...');
  const client = new Client({
    connectionString: "postgresql://postgres.zjxvacezqbhyomrngynq:5T6oIAxMBoPFRRz2@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
  });

  try {
    await client.connect();
    await createTables(client);
    await client.end();
    console.log('✅ Tables created with pooling connection!');
  } catch (error) {
    console.error('❌ Pooling table creation failed:', error.message);
    await client.end();
    throw error;
  }
}

async function createTablesWithDirect() {
  console.log('🚀 Creating tables with direct connection...');
  const client = new Client({
    connectionString: "postgresql://postgres.zjxvacezqbhyomrngynq:5T6oIAxMBoPFRRz2@aws-0-us-east-2.pooler.supabase.com:5432/postgres"
  });

  try {
    await client.connect();
    await createTables(client);
    await client.end();
    console.log('✅ Tables created with direct connection!');
  } catch (error) {
    console.error('❌ Direct table creation failed:', error.message);
    await client.end();
    throw error;
  }
}

async function createTables(client) {
  console.log('📋 Creating leads table...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID NOT NULL,
      stage TEXT NOT NULL DEFAULT 'new_lead',
      notes TEXT DEFAULT '',
      last_contact_date TIMESTAMP WITH TIME ZONE,
      next_follow_up_date TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      -- Extended business detail fields
      owner_name TEXT,
      software_used TEXT,
      interest_level INTEGER CHECK (interest_level >= 1 AND interest_level <= 5),
      estimated_value DECIMAL(10,2),
      best_contact_time TEXT,
      qualification_checklist JSONB DEFAULT '{}',
      next_followup_date TIMESTAMP WITH TIME ZONE
    );
  `);
  console.log('✅ Leads table created');

  console.log('📝 Creating lead_notes table...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS lead_notes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      is_private BOOLEAN DEFAULT false,
      created_by TEXT NOT NULL DEFAULT 'admin',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log('✅ Lead notes table created');

  console.log('📊 Creating lead_activity table...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS lead_activity (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
      activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'email', 'sms', 'stage_move', 'note')),
      description TEXT NOT NULL,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log('✅ Lead activity table created');

  console.log('🔗 Creating indexes...');
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_leads_company_id ON leads(company_id);
    CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
    CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON lead_notes(lead_id);
    CREATE INDEX IF NOT EXISTS idx_lead_activity_lead_id ON lead_activity(lead_id);
  `);
  console.log('✅ Indexes created');
}

testConnections().then(() => {
  console.log('🎉 Setup completed successfully!');
  process.exit(0);
}).catch(err => {
  console.error('💥 Setup failed:', err);
  process.exit(1);
});