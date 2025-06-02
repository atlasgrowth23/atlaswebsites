import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zjxvacezqbhyomrngynq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqeHZhY2V6cWJoeW9tcm5neW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODYzOTg2NCwiZXhwIjoyMDY0MjE1ODY0fQ.1dbOL9c54yChzqziz7BNTh-JLs4jQRomw18XhQJP_bs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTrackingTables() {
  console.log('🔧 Creating tracking tables in Supabase...\n');

  try {
    // Create template_views table
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (error1) console.log('template_views:', error1.message);
    else console.log('✅ template_views table created');

    // Create prospect_tracking table
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS prospect_tracking (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          company_id TEXT NOT NULL,
          session_id TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          name TEXT,
          message TEXT,
          form_type TEXT,
          source_page TEXT,
          referrer_url TEXT,
          user_agent TEXT,
          ip_address INET,
          country TEXT,
          city TEXT,
          latitude DECIMAL(10, 8),
          longitude DECIMAL(11, 8),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    if (error2) console.log('prospect_tracking:', error2.message);
    else console.log('✅ prospect_tracking table created');

    // Create daily_analytics table
    const { error: error3 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS daily_analytics (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          company_id TEXT NOT NULL,
          date DATE NOT NULL,
          total_views INTEGER DEFAULT 0,
          unique_sessions INTEGER DEFAULT 0,
          total_time_seconds INTEGER DEFAULT 0,
          bounce_rate DECIMAL(5, 2),
          mobile_percentage DECIMAL(5, 2),
          top_referrer TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(company_id, date)
        );
      `
    });

    if (error3) console.log('daily_analytics:', error3.message);
    else console.log('✅ daily_analytics table created');

    // Test insertion
    console.log('\n🧪 Testing data insertion...');
    const testData = {
      company_id: 'test-company-123',
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

    const { data, error } = await supabase
      .from('template_views')
      .insert([testData])
      .select()
      .single();

    if (error) {
      console.error('❌ Test insertion failed:', error);
    } else {
      console.log('✅ Test insertion successful');
      console.log('   Tracking ID:', data.id);
      
      // Clean up
      await supabase.from('template_views').delete().eq('id', data.id);
      console.log('✅ Test data cleaned up');
    }

    console.log('\n🎉 Tracking system is ready!');
    console.log('Visit any company page to start collecting data.');

  } catch (err) {
    console.error('❌ Error:', err);
  }
}

createTrackingTables();