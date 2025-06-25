const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Running business detail schema migration...');

  try {
    // Add columns to leads table one by one
    const columns = [
      { name: 'owner_name', type: 'TEXT' },
      { name: 'software_used', type: 'TEXT' },
      { name: 'interest_level', type: 'INTEGER' },
      { name: 'estimated_value', type: 'DECIMAL(10,2)' },
      { name: 'best_contact_time', type: 'TEXT' },
      { name: 'qualification_checklist', type: 'JSONB DEFAULT \'{}\'::jsonb' },
      { name: 'next_followup_date', type: 'TIMESTAMP WITH TIME ZONE' }
    ];

    for (const column of columns) {
      console.log(`Adding column: ${column.name}`);
      const { error } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE leads ADD COLUMN IF NOT EXISTS ${column.name} ${column.type};`
      });
      
      if (error && !error.message.includes('already exists')) {
        console.error(`Error adding column ${column.name}:`, error);
      } else {
        console.log(`✅ Column ${column.name} added successfully`);
      }
    }

    // Create lead_notes table
    console.log('Creating lead_notes table...');
    const { error: notesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS lead_notes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          is_private BOOLEAN DEFAULT false,
          created_by TEXT NOT NULL DEFAULT 'admin',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (notesError) {
      console.error('Error creating lead_notes table:', notesError);
    } else {
      console.log('✅ lead_notes table created');
    }

    // Create lead_activity table
    console.log('Creating lead_activity table...');
    const { error: activityError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS lead_activity (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
          activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'email', 'sms', 'stage_move', 'note')),
          description TEXT NOT NULL,
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (activityError) {
      console.error('Error creating lead_activity table:', activityError);
    } else {
      console.log('✅ lead_activity table created');
    }

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    // Fallback: Try to check if the tables exist
    console.log('🔍 Checking existing schema...');
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
      
    console.log('Existing tables:', tables?.map(t => t.table_name));
    process.exit(1);
  }
}

runMigration().then(() => {
  console.log('Migration process completed');
  process.exit(0);
}).catch(err => {
  console.error('Migration process failed:', err);
  process.exit(1);
});