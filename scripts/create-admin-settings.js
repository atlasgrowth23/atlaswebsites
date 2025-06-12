const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zjxvacezqbhyomrngynq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqeHZhY2V6cWJoeW9tcm5neW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODYzOTg2NCwiZXhwIjoyMDY0MjE1ODY0fQ.1dbOL9c54yChzqziz7BNTh-JLs4jQRomw18XhQJP_bs'
);

async function createAdminSettingsTable() {
  try {
    console.log('🚀 Creating admin_settings table...');
    
    // First, check if table exists
    const { data: existingTables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'admin_settings');
      
    if (checkError) {
      console.log('Cannot check existing tables, proceeding with creation...');
    }
    
    if (existingTables && existingTables.length > 0) {
      console.log('✅ admin_settings table already exists');
      
      // Check current settings
      const { data: settings, error: selectError } = await supabase
        .from('admin_settings')
        .select('*');
        
      if (!selectError) {
        console.log('📊 Current settings:', settings);
        return;
      }
    }
    
    // Try to create using direct insert approach
    console.log('Creating table via direct operations...');
    
    // This won't work with Supabase client for DDL, so let's just ensure the data exists
    // We'll assume the table exists or will be created manually
    
    const { data: testSelect, error: testError } = await supabase
      .from('admin_settings')
      .select('*')
      .limit(1);
      
    if (testError && testError.message.includes('does not exist')) {
      console.log('❌ Table does not exist. Please create it manually in Supabase Dashboard:');
      console.log(`
CREATE TABLE admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO admin_settings (key, value) VALUES 
  ('team_calendar_id', 'null'::jsonb),
  ('demo_mode', 'false'::jsonb);
      `);
      return;
    }
    
    // Insert default settings
    console.log('🔧 Inserting default settings...');
    
    const settings = [
      { key: 'team_calendar_id', value: null },
      { key: 'demo_mode', value: false }
    ];
    
    for (const setting of settings) {
      const { error: upsertError } = await supabase
        .from('admin_settings')
        .upsert(setting, { onConflict: 'key' });
        
      if (upsertError) {
        console.log(`⚠️  Could not upsert ${setting.key}:`, upsertError.message);
      } else {
        console.log(`✅ Setting ${setting.key} ready`);
      }
    }
    
    // Verify final state
    const { data: finalSettings, error: finalError } = await supabase
      .from('admin_settings')
      .select('*');
      
    if (!finalError) {
      console.log('📊 Final settings state:', finalSettings);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createAdminSettingsTable().catch(console.error);