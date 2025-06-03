import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', 'env.local') });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupLeadPipelineTables() {
  console.log('🚀 Setting up lead pipeline tables...');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-lead-pipeline-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('❌ Error executing SQL:', error);
      return;
    }

    console.log('✅ Lead pipeline tables created successfully!');

    // Verify tables were created
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', ['leads', 'lead_notes', 'lead_activities'])
      .eq('table_schema', 'public');

    if (tableError) {
      console.error('❌ Error verifying tables:', tableError);
      return;
    }

    console.log('📋 Tables created:');
    tables?.forEach(table => {
      console.log(`  ✓ ${table.table_name}`);
    });

    // Test basic functionality
    console.log('\n🧪 Testing basic functionality...');
    
    // Get a sample company ID
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .limit(1);

    if (companyError || !companies?.length) {
      console.log('⚠️ No companies found for testing');
      return;
    }

    const companyId = companies[0].id;

    // Test inserting a lead
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .insert({
        company_id: companyId,
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

    console.log('✅ Test lead created:', leadData.id);

    // Test adding a note
    const { data: noteData, error: noteError } = await supabase
      .from('lead_notes')
      .insert({
        lead_id: leadData.id,
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

    console.log('✅ Test note created:', noteData.id);

    // Test updating lead status (should trigger activity log)
    const { error: updateError } = await supabase
      .from('leads')
      .update({ status: 'called' })
      .eq('id', leadData.id);

    if (updateError) {
      console.error('❌ Error updating lead status:', updateError);
      return;
    }

    console.log('✅ Lead status updated');

    // Check if activity was logged
    const { data: activities, error: activityError } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('lead_id', leadData.id);

    if (activityError) {
      console.error('❌ Error fetching activities:', activityError);
      return;
    }

    console.log(`✅ Activities logged: ${activities?.length || 0}`);
    activities?.forEach(activity => {
      console.log(`  - ${activity.activity_type}: ${activity.old_value} → ${activity.new_value}`);
    });

    // Clean up test data
    await supabase.from('leads').delete().eq('id', leadData.id);
    console.log('🧹 Test data cleaned up');

    console.log('\n🎉 Lead pipeline setup completed successfully!');
    console.log('\n📚 Available tables:');
    console.log('  • leads - Main lead records');
    console.log('  • lead_notes - Notes and communications');
    console.log('  • lead_activities - Audit trail and activity log');
    console.log('\n🔑 Features enabled:');
    console.log('  • Automatic timestamp updates');
    console.log('  • Status change logging');
    console.log('  • Note addition logging');
    console.log('  • Row Level Security (RLS)');
    console.log('  • Foreign key constraints');
    console.log('  • Performance indexes');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Execute if run directly
if (require.main === module) {
  setupLeadPipelineTables();
}

export { setupLeadPipelineTables };