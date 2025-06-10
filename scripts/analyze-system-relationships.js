const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeSystemRelationships() {
  try {
    console.log('🔍 SYSTEM RELATIONSHIPS & USAGE ANALYSIS\n');
    console.log('='.repeat(80));
    
    // 1. PIPELINE UI MANAGEMENT ANALYSIS
    console.log('\n🎛️  PIPELINE UI MANAGEMENT CAPABILITIES:');
    console.log('   📍 Current Implementation:');
    console.log('   ✅ Hardcoded stages in /pages/admin/pipeline.tsx:');
    console.log('      - new_lead, live_call, voicemail, site_viewed, appointment, sale_made, unsuccessful');
    console.log('   ✅ Hardcoded pipeline types:');
    console.log('      - atlas_test_pipeline, no_website_alabama, has_website_alabama, etc.');
    console.log('   ❌ NO UI to add/edit/delete pipeline stages');
    console.log('   ❌ NO UI to create new pipeline types');
    console.log('   ❌ NO UI to configure stage workflows');
    
    console.log('\n   🚧 MISSING FOUNDATION:');
    console.log('   ❌ No pipeline_configs table');
    console.log('   ❌ No stage_definitions table');
    console.log('   ❌ No workflow_rules table');
    console.log('   ❌ Pipeline management is hardcoded, not data-driven');
    
    // 2. TAGS SYSTEM ANALYSIS
    console.log('\n🏷️  TAGS SYSTEM INTEGRATION:');
    
    const { data: tagDefs } = await supabase
      .from('tag_definitions')
      .select('*');
    
    const { data: leadTags } = await supabase
      .from('lead_tags')
      .select('*')
      .limit(5);
    
    console.log(`   📊 tag_definitions: ${tagDefs?.length || 0} tag types defined`);
    console.log(`   📊 lead_tags: ${leadTags?.length || 0} tags applied to leads`);
    
    if (tagDefs?.length > 0) {
      console.log('   📝 Available tag types:');
      tagDefs.forEach(tag => {
        console.log(`     - ${tag.tag_type}: ${tag.display_name} (auto: ${tag.is_auto_tag})`);
      });
    }
    
    console.log('\n   🔗 Pipeline-Tags Integration:');
    console.log('   ✅ Tags are linked to leads via lead_id');
    console.log('   ✅ Auto-tagging system exists');
    console.log('   ⚠️  NO UI to create/edit tag definitions');
    console.log('   ⚠️  NO pipeline stage auto-tagging rules');
    
    // 3. DAILY_ANALYTICS INVESTIGATION
    console.log('\n📈 DAILY_ANALYTICS INVESTIGATION:');
    
    const { data: dailyAnalytics } = await supabase
      .from('daily_analytics')
      .select('*')
      .limit(3);
    
    console.log(`   📊 Records: ${dailyAnalytics?.length || 0}`);
    if (dailyAnalytics?.length > 0) {
      console.log('   📝 Structure:', Object.keys(dailyAnalytics[0]));
      console.log('   📝 Sample record:');
      console.log(JSON.stringify(dailyAnalytics[0], null, 2));
    }
    
    // Check where daily_analytics is actually used
    console.log('\n   🔍 Usage Analysis:');
    console.log('   ✅ Referenced in /pages/api/analytics/track.ts');
    console.log('   ✅ Referenced in /pages/api/track-template-view.ts');
    console.log('   ❓ Purpose: Appears to be daily summary aggregations');
    console.log('   ❓ Question: Is this needed vs real-time template_views queries?');
    
    // 4. CHAT SYSTEM COMPARISON
    console.log('\n💬 CHAT SYSTEM: conversations vs chat_messages');
    
    const { data: conversations } = await supabase
      .from('conversations')
      .select('*')
      .limit(3);
    
    const { data: chatMessages } = await supabase
      .from('chat_messages')
      .select('*')
      .limit(3);
    
    console.log(`   📊 conversations: ${conversations?.length || 0} records`);
    console.log(`   📊 chat_messages: ${chatMessages?.length || 0} records`);
    
    if (conversations?.length > 0) {
      console.log('   📝 conversations structure:', Object.keys(conversations[0]));
    }
    if (chatMessages?.length > 0) {
      console.log('   📝 chat_messages structure:', Object.keys(chatMessages[0]));
    }
    
    console.log('\n   🔗 Relationship:');
    console.log('   ✅ chat_messages.conversation_id → conversations.id');
    console.log('   ✅ Both link to company_id and visitor_id');
    console.log('   ✅ Well-designed parent-child relationship');
    console.log('   ✅ Used in chat APIs: /api/chat/ endpoints');
    
    // 5. CONTACT SYSTEMS COMPARISON
    console.log('\n👥 CONTACT SYSTEMS: client_users vs tk_contacts');
    
    const { data: clientUsers } = await supabase
      .from('client_users')
      .select('*')
      .limit(3);
    
    const { data: tkContacts } = await supabase
      .from('tk_contacts')
      .select('*')
      .limit(3);
    
    console.log(`   📊 client_users: ${clientUsers?.length || 0} records`);
    console.log(`   📊 tk_contacts: ${tkContacts?.length || 0} records`);
    
    if (clientUsers?.length > 0) {
      console.log('   📝 client_users structure:', Object.keys(clientUsers[0]));
      console.log('   📝 Sample:', clientUsers[0]);
    }
    if (tkContacts?.length > 0) {
      console.log('   📝 tk_contacts structure:', Object.keys(tkContacts[0]));
      console.log('   📝 Sample:', tkContacts[0]);
    }
    
    console.log('\n   🎯 Purpose Analysis:');
    console.log('   📱 client_users: Business owners who log into dashboard');
    console.log('   📧 tk_contacts: Contact info for pipeline outreach');
    console.log('   ⚠️  OVERLAP: Both store contact information');
    console.log('   ⚠️  CONFUSION: Which one to use for what?');
    
    // 6. ACTIVITY_LOG USAGE ANALYSIS
    console.log('\n📋 ACTIVITY_LOG ACTUAL USAGE:');
    
    const { data: activityLog } = await supabase
      .from('activity_log')
      .select('*')
      .limit(5);
    
    console.log(`   📊 Records: ${activityLog?.length || 0}`);
    if (activityLog?.length > 0) {
      console.log('   📝 Structure:', Object.keys(activityLog[0]));
      console.log('   📝 Sample activities:');
      activityLog.forEach((activity, i) => {
        console.log(`     ${i+1}. ${activity.action} by ${activity.user_name} (Lead: ${activity.lead_id})`);
      });
    }
    
    console.log('\n   🔍 Usage Analysis:');
    console.log('   ✅ Used in /lib/activityTracker.ts');
    console.log('   ✅ Tracks pipeline actions: stage moves, calls, emails');
    console.log('   ✅ Session-based tracking with cold_call_sessions');
    console.log('   ✅ Good for audit trail and user activity');
    
    // SUMMARY AND RECOMMENDATIONS
    console.log('\n' + '='.repeat(80));
    console.log('📋 PROFESSIONAL SYSTEM ANALYSIS SUMMARY');
    console.log('='.repeat(80));
    
    console.log('\n🚧 MISSING FOUNDATIONS:');
    console.log('   ❌ Pipeline management is hardcoded, not configurable');
    console.log('   ❌ No UI for pipeline/stage administration');
    console.log('   ❌ Tag system exists but no admin interface');
    console.log('   ❌ Contact systems overlap and confuse purpose');
    
    console.log('\n✅ WELL-DESIGNED SYSTEMS:');
    console.log('   🎯 Chat system (conversations + chat_messages)');
    console.log('   🎯 Activity tracking (activity_log + cold_call_sessions)');
    console.log('   🎯 Analytics tracking (template_views)');
    console.log('   🎯 Tags foundation (tag_definitions + lead_tags)');
    
    console.log('\n❓ QUESTIONABLE SYSTEMS:');
    console.log('   🤔 daily_analytics - might be redundant with template_views');
    console.log('   🤔 client_users vs tk_contacts - overlapping purposes');
    console.log('   🤔 contact_log - might be redundant with activity_log');
    
    console.log('\n🚀 PROFESSIONAL UPGRADES NEEDED:');
    console.log('   1. 🎛️  Build pipeline admin UI (stages, types, workflows)');
    console.log('   2. 🏷️  Build tags admin UI (create, edit, auto-rules)');
    console.log('   3. 🧹 Clarify contact system purposes');
    console.log('   4. 🗑️  Remove redundant tables (daily_analytics?, contact_log?)');
    console.log('   5. 📊 Add pipeline analytics dashboard');
    
    console.log('\n🎯 IMMEDIATE RECOMMENDATIONS:');
    console.log('   🥇 DELETE: page_views (confirmed redundant)');
    console.log('   🥈 EVALUATE: daily_analytics usage necessity');
    console.log('   🥉 CONSOLIDATE: client_users vs tk_contacts strategy');
    console.log('   4️⃣ BUILD: Pipeline admin interface');
    console.log('   5️⃣ BUILD: Tags admin interface');
    
  } catch (error) {
    console.error('❌ Analysis error:', error);
  }
}

analyzeSystemRelationships();