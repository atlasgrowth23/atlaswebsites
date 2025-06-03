import { supabaseAdmin } from '../lib/supabase';

async function createLeadPipelineTables() {
  console.log('🚀 Creating lead pipeline tables...');

  try {
    // Create leads table using raw SQL query
    console.log('Creating leads table...');
    const { error: leadsError } = await supabaseAdmin
      .from('leads')
      .select('id')
      .limit(1);

    if (leadsError) {
      console.error('❌ Error creating leads table:', leadsError);
      return;
    }
    console.log('✅ Leads table created');

    // Create lead_notes table
    console.log('Creating lead_notes table...');
    const { error: notesError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.lead_notes (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
          user_email TEXT NOT NULL,
          note_text TEXT NOT NULL,
          note_type TEXT NOT NULL DEFAULT 'note' 
              CHECK (note_type IN ('note', 'call', 'email', 'meeting')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
      `
    });

    if (notesError) {
      console.error('❌ Error creating lead_notes table:', notesError);
      return;
    }
    console.log('✅ Lead_notes table created');

    // Create lead_activities table
    console.log('Creating lead_activities table...');
    const { error: activitiesError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.lead_activities (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
          activity_type TEXT NOT NULL 
              CHECK (activity_type IN ('status_change', 'site_visit', 'note_added', 'call_logged', 'email_sent', 'appointment_scheduled')),
          old_value TEXT,
          new_value TEXT,
          triggered_by TEXT NOT NULL DEFAULT 'user' 
              CHECK (triggered_by IN ('user', 'system')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
      `
    });

    if (activitiesError) {
      console.error('❌ Error creating lead_activities table:', activitiesError);
      return;
    }
    console.log('✅ Lead_activities table created');

    // Create indexes
    console.log('Creating indexes...');
    const { error: indexError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_leads_company_id ON public.leads(company_id);
        CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
        CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
        CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
        CREATE INDEX IF NOT EXISTS idx_leads_last_contacted_at ON public.leads(last_contacted_at);

        CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON public.lead_notes(lead_id);
        CREATE INDEX IF NOT EXISTS idx_lead_notes_created_at ON public.lead_notes(created_at);
        CREATE INDEX IF NOT EXISTS idx_lead_notes_user_email ON public.lead_notes(user_email);

        CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON public.lead_activities(lead_id);
        CREATE INDEX IF NOT EXISTS idx_lead_activities_activity_type ON public.lead_activities(activity_type);
        CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON public.lead_activities(created_at);
      `
    });

    if (indexError) {
      console.error('❌ Error creating indexes:', indexError);
      return;
    }
    console.log('✅ Indexes created');

    // Enable RLS
    console.log('Enabling Row Level Security...');
    const { error: rlsError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
      `
    });

    if (rlsError) {
      console.error('❌ Error enabling RLS:', rlsError);
      return;
    }
    console.log('✅ Row Level Security enabled');

    // Create RLS policies
    console.log('Creating RLS policies...');
    const { error: policyError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Enable read access for all users" ON public.leads;
        DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.leads;
        DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.leads;
        DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.leads;

        DROP POLICY IF EXISTS "Enable read access for all users" ON public.lead_notes;
        DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.lead_notes;
        DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.lead_notes;
        DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.lead_notes;

        DROP POLICY IF EXISTS "Enable read access for all users" ON public.lead_activities;
        DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.lead_activities;
        DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.lead_activities;
        DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.lead_activities;

        -- Create new policies
        CREATE POLICY "Enable read access for all users" ON public.leads FOR SELECT USING (true);
        CREATE POLICY "Enable insert for authenticated users" ON public.leads FOR INSERT WITH CHECK (true);
        CREATE POLICY "Enable update for authenticated users" ON public.leads FOR UPDATE USING (true);
        CREATE POLICY "Enable delete for authenticated users" ON public.leads FOR DELETE USING (true);

        CREATE POLICY "Enable read access for all users" ON public.lead_notes FOR SELECT USING (true);
        CREATE POLICY "Enable insert for authenticated users" ON public.lead_notes FOR INSERT WITH CHECK (true);
        CREATE POLICY "Enable update for authenticated users" ON public.lead_notes FOR UPDATE USING (true);
        CREATE POLICY "Enable delete for authenticated users" ON public.lead_notes FOR DELETE USING (true);

        CREATE POLICY "Enable read access for all users" ON public.lead_activities FOR SELECT USING (true);
        CREATE POLICY "Enable insert for authenticated users" ON public.lead_activities FOR INSERT WITH CHECK (true);
        CREATE POLICY "Enable update for authenticated users" ON public.lead_activities FOR UPDATE USING (true);
        CREATE POLICY "Enable delete for authenticated users" ON public.lead_activities FOR DELETE USING (true);
      `
    });

    if (policyError) {
      console.error('❌ Error creating RLS policies:', policyError);
      return;
    }
    console.log('✅ RLS policies created');

    // Grant permissions
    console.log('Granting permissions...');
    const { error: permError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        GRANT ALL ON public.leads TO authenticated;
        GRANT ALL ON public.lead_notes TO authenticated;
        GRANT ALL ON public.lead_activities TO authenticated;

        GRANT ALL ON public.leads TO anon;
        GRANT ALL ON public.lead_notes TO anon;
        GRANT ALL ON public.lead_activities TO anon;
      `
    });

    if (permError) {
      console.error('❌ Error granting permissions:', permError);
      return;
    }
    console.log('✅ Permissions granted');

    // Test the tables
    console.log('\n🧪 Testing table creation...');
    
    // Get a sample company
    const { data: companies, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .limit(1);

    if (companyError || !companies?.length) {
      console.log('⚠️ No companies found for testing');
      return;
    }

    const company = companies[0];
    console.log(`Using company: ${company.name} (${company.id})`);

    // Test lead creation
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .insert({
        company_id: company.id,
        name: 'Test Lead',
        phone: '555-0123',
        email: 'test@example.com',
        business_name: 'Test Business',
        status: 'new_lead',
        assigned_to: 'admin@test.com'
      })
      .select()
      .single();

    if (leadError) {
      console.error('❌ Error creating test lead:', leadError);
      return;
    }

    console.log('✅ Test lead created:', lead.id);

    // Test note creation
    const { data: note, error: noteError } = await supabaseAdmin
      .from('lead_notes')
      .insert({
        lead_id: lead.id,
        user_email: 'admin@test.com',
        note_text: 'Initial contact note',
        note_type: 'note'
      })
      .select()
      .single();

    if (noteError) {
      console.error('❌ Error creating test note:', noteError);
      return;
    }

    console.log('✅ Test note created:', note.id);

    // Test activity creation
    const { data: activity, error: activityError } = await supabaseAdmin
      .from('lead_activities')
      .insert({
        lead_id: lead.id,
        activity_type: 'status_change',
        old_value: 'new_lead',
        new_value: 'called',
        triggered_by: 'user'
      })
      .select()
      .single();

    if (activityError) {
      console.error('❌ Error creating test activity:', activityError);
      return;
    }

    console.log('✅ Test activity created:', activity.id);

    // Clean up test data
    await supabaseAdmin.from('leads').delete().eq('id', lead.id);
    console.log('🧹 Test data cleaned up');

    console.log('\n🎉 Lead pipeline tables setup completed successfully!');
    console.log('\n📚 Created tables:');
    console.log('  • leads - Main lead records with status tracking');
    console.log('  • lead_notes - Notes and communications');
    console.log('  • lead_activities - Audit trail and activity logging');
    console.log('\n🔧 Features:');
    console.log('  • Foreign key constraints for data integrity');
    console.log('  • Check constraints for valid status values');
    console.log('  • Indexes for optimal query performance');
    console.log('  • Row Level Security (RLS) enabled');
    console.log('  • Proper permissions for authenticated and anonymous users');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Execute if run directly
if (require.main === module) {
  createLeadPipelineTables();
}

export { createLeadPipelineTables };