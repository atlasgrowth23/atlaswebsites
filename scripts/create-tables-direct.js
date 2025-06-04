const { Client } = require('pg');
require('dotenv').config({ path: 'env.local' });

const client = new Client({
  connectionString: process.env.DIRECT_URL
});

async function createTables() {
  try {
    console.log('🚀 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!');

    // Check existing tables
    console.log('🔍 Checking existing tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('Existing tables:', tablesResult.rows.map(r => r.table_name));

    // Create leads table
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

    // Create lead_notes table
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

    // Create lead_activity table
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

    // Create indexes
    console.log('🔗 Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_leads_company_id ON leads(company_id);
      CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
      CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON lead_notes(lead_id);
      CREATE INDEX IF NOT EXISTS idx_lead_activity_lead_id ON lead_activity(lead_id);
      CREATE INDEX IF NOT EXISTS idx_leads_next_followup ON leads(next_followup_date) WHERE next_followup_date IS NOT NULL;
    `);
    console.log('✅ Indexes created');

    // Check final table list
    console.log('🔍 Final table check...');
    const finalTablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('All tables:', finalTablesResult.rows.map(r => r.table_name));

    console.log('🎉 Database schema setup completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('📤 Database connection closed');
  }
}

createTables().then(() => {
  console.log('✨ Setup completed successfully!');
  process.exit(0);
}).catch(err => {
  console.error('💥 Setup failed:', err);
  process.exit(1);
});