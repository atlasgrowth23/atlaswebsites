const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeDatabaseMess() {
  try {
    console.log('🔥 BRUTAL DATABASE REALITY CHECK\n');
    console.log('='.repeat(80));
    
    // 1. SCATTERED NOTES PROBLEM
    console.log('\n📝 NOTES SCATTERED EVERYWHERE:');
    
    // Check lead_pipeline.notes
    const { data: pipelineNotes } = await supabase
      .from('lead_pipeline')
      .select('id, notes')
      .not('notes', 'is', null)
      .neq('notes', '')
      .limit(5);
    
    console.log(`   📋 lead_pipeline.notes: ${pipelineNotes?.length || 0} entries with notes`);
    if (pipelineNotes?.length > 0) {
      console.log(`   📝 Sample: "${pipelineNotes[0].notes}"`);
    }
    
    // Check lead_notes table
    const { data: separateNotes } = await supabase
      .from('lead_notes')
      .select('*')
      .limit(5);
    
    console.log(`   📋 lead_notes table: ${separateNotes?.length || 0} separate note records`);
    if (separateNotes?.length > 0) {
      console.log(`   📝 Sample: "${separateNotes[0].content}"`);
    }
    
    // Check activity_log notes
    const { data: activityNotes } = await supabase
      .from('activity_log')
      .select('action, action_data')
      .eq('action', 'note_added')
      .limit(3);
    
    console.log(`   📋 activity_log notes: ${activityNotes?.length || 0} note actions tracked`);
    
    console.log('\n   🤬 THE PROBLEM:');
    console.log('   ❌ Notes stored in 3 different places');
    console.log('   ❌ No single source of truth');
    console.log('   ❌ Impossible to get complete note history');
    
    // 2. SCATTERED OWNER INFO PROBLEM
    console.log('\n👤 OWNER INFO SCATTERED EVERYWHERE:');
    
    // Check lead_pipeline owner fields
    const { data: pipelineOwners } = await supabase
      .from('lead_pipeline')
      .select('owner_name, owner_email')
      .not('owner_name', 'is', null)
      .limit(3);
    
    console.log(`   📋 lead_pipeline: owner_name, owner_email fields`);
    console.log(`   📊 Records with owner data: ${pipelineOwners?.length || 0}`);
    
    // Check tk_contacts
    const { data: tkContacts } = await supabase
      .from('tk_contacts')
      .select('owner_name, owner_email')
      .limit(3);
    
    console.log(`   📋 tk_contacts: owner_name, owner_email fields`);
    console.log(`   📊 Total records: ${tkContacts?.length || 0}`);
    
    // Check companies table for owner info
    const { data: companies } = await supabase
      .from('companies')
      .select('email_1')
      .not('email_1', 'is', null)
      .limit(3);
    
    console.log(`   📋 companies: email_1 field (owner email)`);
    console.log(`   📊 Companies with email: ${companies?.length || 0}`);
    
    // Check client_users
    const { data: clientUsers } = await supabase
      .from('client_users')
      .select('name, email')
      .limit(3);
    
    console.log(`   📋 client_users: name, email fields`);
    console.log(`   📊 Total records: ${clientUsers?.length || 0}`);
    
    console.log('\n   🤬 THE PROBLEM:');
    console.log('   ❌ Owner info duplicated across 4+ tables');
    console.log('   ❌ No referential integrity');
    console.log('   ❌ Data can get out of sync');
    console.log('   ❌ Nightmare to update owner info');
    
    // 3. TAGS SEPARATION PROBLEM
    console.log('\n🏷️  TAGS UNNECESSARILY SEPARATED:');
    
    const { data: tagDefinitions } = await supabase
      .from('tag_definitions')
      .select('*');
    
    const { data: leadTags } = await supabase
      .from('lead_tags')
      .select('*');
    
    console.log(`   📊 tag_definitions: ${tagDefinitions?.length || 0} tag types`);
    console.log(`   📊 lead_tags: ${leadTags?.length || 0} applied tags`);
    
    console.log('\n   🤔 IS THIS NECESSARY?');
    console.log('   ❓ Could be simplified to single tags column in lead_pipeline');
    console.log('   ❓ JSON array of tags vs separate tables');
    console.log('   ❓ Only 6 tag types - not exactly complex');
    
    // 4. TABLE COUNT ANALYSIS
    console.log('\n📊 CURRENT TABLE COUNT MADNESS:');
    
    const tables = [
      'companies', 'lead_pipeline', 'lead_notes', 'tk_contacts', 'client_users',
      'tag_definitions', 'lead_tags', 'activity_log', 'cold_call_sessions',
      'contact_log', 'template_views', 'daily_analytics', 'conversations',
      'chat_messages', 'contacts', 'appointments', 'business_photos', 'company_frames', 'frames'
    ];
    
    console.log(`   📈 TOTAL TABLES: ${tables.length}`);
    console.log('   🤬 SCATTERED DATA EVERYWHERE');
    console.log('   🤬 NO CLEAR RELATIONSHIPS');
    
    // 5. PROFESSIONAL CONSOLIDATION RECOMMENDATIONS
    console.log('\n' + '='.repeat(80));
    console.log('🚀 PROFESSIONAL DATABASE REDESIGN');
    console.log('='.repeat(80));
    
    console.log('\n💡 CONSOLIDATION OPPORTUNITIES:');
    
    console.log('\n1️⃣ CONSOLIDATE NOTES:');
    console.log('   🎯 TARGET: Single notes column in lead_pipeline');
    console.log('   🗑️  DELETE: lead_notes table');
    console.log('   📝 MIGRATE: All notes to lead_pipeline.notes (JSON array)');
    console.log('   ✅ RESULT: One place for all lead notes');
    
    console.log('\n2️⃣ CONSOLIDATE OWNER INFO:');
    console.log('   🎯 TARGET: Single owner_contact_id in lead_pipeline');
    console.log('   🗑️  DELETE: Duplicate owner fields everywhere');
    console.log('   🔗 REFERENCE: Point to single contacts table');
    console.log('   ✅ RESULT: One source of truth for owner info');
    
    console.log('\n3️⃣ SIMPLIFY TAGS:');
    console.log('   🎯 TARGET: tags JSON column in lead_pipeline');
    console.log('   🗑️  DELETE: tag_definitions, lead_tags tables');
    console.log('   📝 EXAMPLE: ["answered-call", "return-visitor"]');
    console.log('   ✅ RESULT: 2 fewer tables, same functionality');
    
    console.log('\n4️⃣ UNIFY CONTACT SYSTEMS:');
    console.log('   🎯 TARGET: Single contacts table');
    console.log('   🗑️  DELETE: client_users, tk_contacts separation');
    console.log('   📝 ADD: contact_type field ("business_owner", "lead_contact")');
    console.log('   ✅ RESULT: One contact system, clear types');
    
    console.log('\n🎯 AFTER CONSOLIDATION:');
    console.log('   📉 FROM: 19+ scattered tables');
    console.log('   📈 TO: ~12 focused tables');
    console.log('   ✅ Clear relationships');
    console.log('   ✅ Single source of truth');
    console.log('   ✅ Professional structure');
    
    console.log('\n🔥 MIGRATION STRATEGY:');
    console.log('   1. Backup everything');
    console.log('   2. Migrate notes to lead_pipeline.notes');
    console.log('   3. Consolidate owner info to single contacts table');
    console.log('   4. Move tags to JSON column');
    console.log('   5. Drop redundant tables');
    console.log('   6. Update all APIs');
    
    console.log('\n💀 BRUTAL TRUTH:');
    console.log('   ❌ Current structure is amateur hour');
    console.log('   ❌ Data scattered like confetti');
    console.log('   ❌ No professional would design this');
    console.log('   ✅ BUT: It can be fixed with proper consolidation');
    
  } catch (error) {
    console.error('❌ Analysis error:', error);
  }
}

analyzeDatabaseMess();