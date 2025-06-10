const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function compareContactLogVsActivityLog() {
  try {
    console.log('🔍 CONTACT_LOG vs ACTIVITY_LOG COMPARISON\n');
    console.log('='.repeat(70));
    
    // Get contact_log data
    const { data: contactLog } = await supabase
      .from('contact_log')
      .select('*')
      .limit(10);
    
    console.log('\n📋 CONTACT_LOG ANALYSIS:');
    console.log(`   📊 Total records: ${contactLog?.length || 0}`);
    if (contactLog?.length > 0) {
      console.log('   📝 Structure:', Object.keys(contactLog[0]));
      console.log('   📝 Purpose: Stage transition tracking');
      console.log('   📝 Sample data:');
      contactLog.slice(0, 3).forEach((log, i) => {
        console.log(`     ${i+1}. ${log.stage_from} → ${log.stage_to} (${log.created_by})`);
        console.log(`        Company: ${log.company_id}`);
        console.log(`        Notes: "${log.notes}"`);
        console.log(`        Date: ${log.created_at}`);
        console.log('');
      });
    }
    
    // Get activity_log data
    const { data: activityLog } = await supabase
      .from('activity_log')
      .select('*')
      .limit(10);
    
    console.log('\n📊 ACTIVITY_LOG ANALYSIS:');
    console.log(`   📊 Total records: ${activityLog?.length || 0}`);
    if (activityLog?.length > 0) {
      console.log('   📝 Structure:', Object.keys(activityLog[0]));
      console.log('   📝 Purpose: User action tracking');
      console.log('   📝 Sample data:');
      activityLog.slice(0, 5).forEach((log, i) => {
        console.log(`     ${i+1}. ${log.action} by ${log.user_name}`);
        console.log(`        Lead: ${log.lead_id}`);
        console.log(`        Session: ${log.session_id}`);
        console.log(`        Data: ${JSON.stringify(log.action_data)}`);
        console.log(`        Date: ${log.created_at}`);
        console.log('');
      });
    }
    
    // Analyze the overlap
    console.log('\n⚖️  OVERLAP ANALYSIS:');
    
    console.log('\n   📋 contact_log characteristics:');
    console.log('   ✅ Tracks stage transitions (stage_from → stage_to)');
    console.log('   ✅ Simple structure focused on pipeline changes');
    console.log('   ✅ Includes transition notes');
    console.log('   ❌ NO session tracking');
    console.log('   ❌ NO user action details');
    
    console.log('\n   📊 activity_log characteristics:');
    console.log('   ✅ Tracks ALL user actions (not just stage changes)');
    console.log('   ✅ Session-based tracking');
    console.log('   ✅ Rich action_data JSON');
    console.log('   ✅ Links to lead_id and user_name');
    console.log('   ❌ More complex structure');
    
    // Check for actual stage transition actions in activity_log
    const stageActions = activityLog?.filter(log => 
      log.action?.includes('stage') || 
      log.action?.includes('move') ||
      log.action?.includes('transition')
    ) || [];
    
    console.log('\n   🔍 Stage tracking comparison:');
    console.log(`   📋 contact_log: Dedicated to stage transitions`);
    console.log(`   📊 activity_log: ${stageActions.length} stage-related actions found`);
    
    // Recommendation
    console.log('\n' + '='.repeat(70));
    console.log('💡 PROFESSIONAL RECOMMENDATION');
    console.log('='.repeat(70));
    
    console.log('\n🎯 VERDICT: DIFFERENT PURPOSES - KEEP BOTH');
    
    console.log('\n   ✅ contact_log: Simple stage transition log');
    console.log('     - Clean, focused on pipeline stage changes');
    console.log('     - Easy to query for stage history');
    console.log('     - Useful for pipeline analytics');
    
    console.log('\n   ✅ activity_log: Comprehensive user action tracking');
    console.log('     - Session-based user activity');
    console.log('     - Rich action details');
    console.log('     - Good for user behavior analysis');
    
    console.log('\n🚀 OPTIMIZATION SUGGESTIONS:');
    console.log('   1. 📝 Rename contact_log → stage_transitions');
    console.log('   2. 📊 Use contact_log for pipeline stage analytics');
    console.log('   3. 📋 Use activity_log for user session analytics');
    console.log('   4. 🔗 Consider linking them (stage_transition_id in activity_log)');
    
    console.log('\n🎯 FINAL DECISION: DO NOT DELETE contact_log');
    console.log('   ✅ Serves different purpose than activity_log');
    console.log('   ✅ Valuable for pipeline stage analytics');
    console.log('   ✅ Simple, focused data structure');
    
  } catch (error) {
    console.error('❌ Analysis error:', error);
  }
}

compareContactLogVsActivityLog();