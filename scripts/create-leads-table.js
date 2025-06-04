const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createLeadsTable() {
  console.log('🚀 Creating leads table and business detail schema...');

  try {
    // First, let's check what tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.error('Error checking tables:', tablesError);
    } else {
      console.log('Existing tables:', tables?.map(t => t.table_name) || []);
    }

    // Create leads table if it doesn't exist
    console.log('Creating leads table...');
    
    const createLeadsSQL = `
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
    `;

    // We'll use a raw query since the table creation might not work through the client
    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createLeadsSQL 
    });

    if (createError) {
      console.log('RPC failed, trying manual table creation approach...');
      
      // Try to insert a test record to see if leads table exists
      const { error: testError } = await supabase
        .from('leads')
        .select('id')
        .limit(1);

      if (testError && testError.code === 'PGRST116') {
        console.log('Leads table does not exist. Let me check the database connection...');
        
        // Let's try to see what we can access
        const { data: schemas, error: schemaError } = await supabase
          .from('information_schema.schemata')
          .select('schema_name');
          
        console.log('Available schemas:', schemas);
        
        // Try to create via companies table as reference
        const { data: companies, error: companiesError } = await supabase
          .from('companies')
          .select('id')
          .limit(1);
          
        if (companiesError) {
          console.log('Companies table error:', companiesError);
        } else {
          console.log('Companies table exists, sample ID:', companies?.[0]?.id);
        }
      }
    } else {
      console.log('✅ Leads table created via RPC');
    }

    // Create lead_notes table
    console.log('Creating lead_notes table...');
    const createNotesSQL = `
      CREATE TABLE IF NOT EXISTS lead_notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_private BOOLEAN DEFAULT false,
        created_by TEXT NOT NULL DEFAULT 'admin',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error: notesError } = await supabase.rpc('exec_sql', {
      sql: createNotesSQL
    });

    if (notesError) {
      console.log('Notes table creation failed:', notesError.message);
    } else {
      console.log('✅ Lead notes table created');
    }

    // Create lead_activity table
    console.log('Creating lead_activity table...');
    const createActivitySQL = `
      CREATE TABLE IF NOT EXISTS lead_activity (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
        activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'email', 'sms', 'stage_move', 'note')),
        description TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error: activityError } = await supabase.rpc('exec_sql', {
      sql: createActivitySQL
    });

    if (activityError) {
      console.log('Activity table creation failed:', activityError.message);
    } else {
      console.log('✅ Lead activity table created');
    }

    // Create indexes
    console.log('Creating indexes...');
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_leads_company_id ON leads(company_id);
      CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
      CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON lead_notes(lead_id);
      CREATE INDEX IF NOT EXISTS idx_lead_activity_lead_id ON lead_activity(lead_id);
    `;

    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: indexSQL
    });

    if (indexError) {
      console.log('Index creation failed:', indexError.message);
    } else {
      console.log('✅ Indexes created');
    }

    console.log('🎉 Schema setup completed!');

  } catch (error) {
    console.error('❌ Schema setup failed:', error);
    
    // Final fallback - let's check what we have access to
    console.log('🔍 Checking database access...');
    try {
      const { data: tables } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
        
      console.log('Tables we can see:', tables?.map(t => t.table_name));
    } catch (e) {
      console.log('Cannot access information_schema');
    }
  }
}

createLeadsTable().then(() => {
  console.log('Setup process completed');
  process.exit(0);
}).catch(err => {
  console.error('Setup process failed:', err);
  process.exit(1);
});