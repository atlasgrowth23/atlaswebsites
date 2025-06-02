// Simple script to test the tracking system
const { createClient } = require('@supabase/supabase-js');

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTracking() {
  try {
    console.log('🧪 Testing tracking system...\n');

    // 1. Check if tables exist
    console.log('1. Checking if tracking tables exist...');
    const { data: tables, error: tablesError } = await supabase
      .from('template_views')
      .select('count', { count: 'exact', head: true });

    if (tablesError) {
      console.error('❌ Tables might not exist:', tablesError.message);
      console.log('\n🔧 Please run this SQL in your Supabase dashboard:');
      console.log('scripts/create-tracking-tables.sql\n');
      return;
    }

    console.log('✅ template_views table exists');

    // 2. Test inserting tracking data
    console.log('\n2. Testing tracking data insertion...');
    const testSessionId = 'test_session_' + Date.now();
    
    const testData = {
      company_id: 'test-company-123',
      company_slug: 'test-company',
      template_key: 'modern-trust',
      session_id: testSessionId,
      user_agent: 'Mozilla/5.0 (Test Browser)',
      referrer_url: 'https://google.com',
      device_type: 'desktop',
      browser_name: 'Chrome',
      total_time_seconds: 30,
      page_interactions: 5,
      is_initial_visit: true
    };

    const { data: insertData, error: insertError } = await supabase
      .from('template_views')
      .insert([testData])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to insert test data:', insertError.message);
      return;
    }

    console.log('✅ Successfully inserted test tracking data');
    console.log('   Session ID:', testSessionId);
    console.log('   Tracking ID:', insertData.id);

    // 3. Test retrieving data
    console.log('\n3. Testing data retrieval...');
    const { data: retrievedData, error: retrieveError } = await supabase
      .from('template_views')
      .select('*')
      .eq('session_id', testSessionId)
      .single();

    if (retrieveError) {
      console.error('❌ Failed to retrieve test data:', retrieveError.message);
      return;
    }

    console.log('✅ Successfully retrieved tracking data');
    console.log('   Time on page:', retrievedData.total_time_seconds, 'seconds');
    console.log('   Device type:', retrievedData.device_type);

    // 4. Test updating session
    console.log('\n4. Testing session update...');
    const { data: updateData, error: updateError } = await supabase
      .from('template_views')
      .update({
        total_time_seconds: 60,
        page_interactions: 10,
        visit_end_time: new Date().toISOString()
      })
      .eq('session_id', testSessionId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update test data:', updateError.message);
      return;
    }

    console.log('✅ Successfully updated session data');
    console.log('   Updated time:', updateData.total_time_seconds, 'seconds');

    // 5. Clean up test data
    console.log('\n5. Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('template_views')
      .delete()
      .eq('session_id', testSessionId);

    if (deleteError) {
      console.error('❌ Failed to clean up test data:', deleteError.message);
    } else {
      console.log('✅ Successfully cleaned up test data');
    }

    console.log('\n🎉 All tracking tests passed! The system is ready to use.');
    console.log('\n📊 Next steps:');
    console.log('   1. Run the SQL in scripts/create-tracking-tables.sql in Supabase');
    console.log('   2. Visit any company page to start collecting real data');
    console.log('   3. Check /session-analytics to view tracking data');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Load environment variables from .env.local if not already loaded
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config({ path: '.env.local' });
}

testTracking();