import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zjxvacezqbhyomrngynq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqeHZhY2V6cWJoeW9tcm5neW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODYzOTg2NCwiZXhwIjoyMDY0MjE1ODY0fQ.1dbOL9c54yChzqziz7BNTh-JLs4jQRomw18XhQJP_bs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTrackingTables() {
  console.log('🔧 Setting up tracking tables in Supabase...\n');

  try {
    // First, let's check if we can connect
    const { data: testConnection, error: connectionError } = await supabase
      .from('companies')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.error('❌ Connection failed:', connectionError);
      return;
    }

    console.log('✅ Connected to Supabase successfully');

    // Create template_views table using raw SQL
    console.log('\n1. Creating template_views table...');
    
    const createTemplateViewsSQL = `
      CREATE TABLE IF NOT EXISTS template_views (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        company_id TEXT NOT NULL,
        company_slug TEXT NOT NULL,
        template_key TEXT NOT NULL,
        session_id TEXT NOT NULL,
        user_agent TEXT,
        referrer_url TEXT,
        ip_address INET,
        country TEXT,
        city TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        device_type TEXT,
        browser_name TEXT,
        total_time_seconds INTEGER DEFAULT 0,
        page_interactions INTEGER DEFAULT 0,
        visit_start_time TIMESTAMPTZ DEFAULT NOW(),
        visit_end_time TIMESTAMPTZ,
        is_initial_visit BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    const { error: tableError1 } = await supabase.rpc('exec_sql', { sql: createTemplateViewsSQL });
    
    if (tableError1) {
      // If exec_sql doesn't work, try creating through pg connection
      console.log('Using alternative creation method...');
      
      // Try to insert a test record to see if table exists
      const { error: insertTest } = await supabase
        .from('template_views')
        .insert([{
          company_id: 'test',
          company_slug: 'test',
          template_key: 'test',
          session_id: 'test',
          total_time_seconds: 1
        }]);

      if (insertTest?.message?.includes('relation "template_views" does not exist')) {
        console.log('❌ Need to create tables manually in Supabase dashboard');
        console.log('Please run the SQL from CREATE_TRACKING_TABLES.sql');
        return;
      } else {
        console.log('✅ template_views table already exists or created');
        // Clean up test record
        await supabase.from('template_views').delete().eq('company_id', 'test');
      }
    } else {
      console.log('✅ template_views table created');
    }

    // Test with actual data insertion
    console.log('\n2. Testing data insertion...');
    const testData = {
      company_id: 'setup-test-' + Date.now(),
      company_slug: 'test-company',
      template_key: 'modern-trust',
      session_id: 'test_session_' + Date.now(),
      user_agent: 'Mozilla/5.0 (Test Browser)',
      device_type: 'desktop',
      browser_name: 'Chrome',
      total_time_seconds: 30,
      page_interactions: 5,
      is_initial_visit: true
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('template_views')
      .insert([testData])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      
      // Show what tables exist
      const { data: tables } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      console.log('Available tables:', tables?.map(t => t.table_name));
      
    } else {
      console.log('✅ Data insertion successful!');
      console.log('   Tracking ID:', insertResult.id);
      console.log('   Session ID:', insertResult.session_id);
      
      // Clean up test data
      await supabase.from('template_views').delete().eq('id', insertResult.id);
      console.log('✅ Test data cleaned up');
      
      console.log('\n🎉 Tracking system is ready!');
      console.log('📊 Visit /session-analytics to see tracking data');
      console.log('🔄 Tracking will start automatically on all company pages');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

setupTrackingTables();