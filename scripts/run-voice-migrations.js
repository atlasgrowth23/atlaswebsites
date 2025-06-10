const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function runVoiceMigrations() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    console.log('🎙️ Running Atlas Voice migrations...');

    // Run voice_logs migration
    console.log('Creating voice_logs table...');
    const voiceLogsSql = fs.readFileSync('./supabase/migrations/20250610_006_add_voice_logs.sql', 'utf8');
    const { error: voiceError } = await supabase.rpc('exec_sql', { sql: voiceLogsSql });
    
    if (voiceError && !voiceError.message.includes('already exists')) {
      console.error('Voice logs migration error:', voiceError);
      throw voiceError;
    }
    console.log('✓ voice_logs table ready');

    // Run demo contacts seed
    console.log('Seeding demo contacts...');
    const seedSql = fs.readFileSync('./supabase/migrations/20250610_007_seed_demo_contacts.sql', 'utf8');
    const { error: seedError } = await supabase.rpc('exec_sql', { sql: seedSql });
    
    if (seedError) {
      console.error('Seed migration error:', seedError);
      // Don't fail if contacts already exist
      if (!seedError.message.includes('duplicate') && !seedError.message.includes('unique')) {
        throw seedError;
      }
    }
    console.log('✓ Demo contacts seeded');

    // Verify the setup
    const { data: voiceLogsCheck } = await supabase.from('voice_logs').select('count').limit(1);
    const { data: contactsCheck } = await supabase
      .from('contacts')
      .select('first_name, last_name')
      .eq('tenant_id', process.env.DEV_TENANT_ID || 'fb8681ab-f3e3-46c4-85b2-ea4aa0816adf')
      .limit(5);

    console.log('📊 Setup verification:');
    console.log(`- voice_logs table: ${voiceLogsCheck ? 'Ready' : 'Error'}`);
    console.log(`- Demo contacts: ${contactsCheck?.length || 0} found`);
    if (contactsCheck?.length > 0) {
      console.log('  Sample contacts:', contactsCheck.map(c => `${c.first_name} ${c.last_name}`).join(', '));
    }

    console.log('🎉 Atlas Voice database setup complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runVoiceMigrations();