const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeContactSystemsCorrectly() {
  try {
    console.log('🔍 CONTACT SYSTEMS - CORRECT ANALYSIS\n');
    console.log('='.repeat(80));
    
    // Check contacts table (customer contacts in dashboard)
    const { data: contacts } = await supabase
      .from('contacts')
      .select('*')
      .limit(3);
    
    console.log('\n👥 CONTACTS TABLE (Customer Dashboard Contacts):');
    console.log(`   📊 Records: ${contacts?.length || 0}`);
    if (contacts?.length > 0) {
      console.log('   📝 Structure:', Object.keys(contacts[0]));
      console.log('   📝 Purpose: Business customers saved in their dashboard');
      console.log('   📝 Sample:', contacts[0]);
    }
    
    // Check tk_contacts (pipeline owner contacts)
    const { data: tkContacts } = await supabase
      .from('tk_contacts')
      .select('*')
      .limit(3);
    
    console.log('\n📧 TK_CONTACTS TABLE (Pipeline Owner Info):');
    console.log(`   📊 Records: ${tkContacts?.length || 0}`);
    if (tkContacts?.length > 0) {
      console.log('   📝 Structure:', Object.keys(tkContacts[0]));
      console.log('   📝 Purpose: Business owner contact info for pipeline outreach');
      console.log('   📝 Sample:', tkContacts[0]);
    }
    
    // Check client_users (business owner auth)
    const { data: clientUsers } = await supabase
      .from('client_users')
      .select('*')
      .limit(3);
    
    console.log('\n🔐 CLIENT_USERS TABLE (Business Owner Auth):');
    console.log(`   📊 Records: ${clientUsers?.length || 0}`);
    if (clientUsers?.length > 0) {
      console.log('   📝 Structure:', Object.keys(clientUsers[0]));
      console.log('   📝 Purpose: Business owners who log into dashboard');
      console.log('   📝 Sample:', clientUsers[0]);
    } else {
      console.log('   📝 Purpose: Business owners who log into dashboard (empty)');
    }
    
    // Check lead_pipeline owner fields
    const { data: pipelineOwners } = await supabase
      .from('lead_pipeline')
      .select('owner_name, owner_email, company_id')
      .not('owner_name', 'is', null)
      .limit(3);
    
    console.log('\n📋 LEAD_PIPELINE OWNER FIELDS:');
    console.log(`   📊 Records with owner data: ${pipelineOwners?.length || 0}`);
    if (pipelineOwners?.length > 0) {
      console.log('   📝 Fields: owner_name, owner_email directly in pipeline');
      console.log('   📝 Sample:', pipelineOwners[0]);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('💡 CORRECTED UNDERSTANDING');
    console.log('='.repeat(80));
    
    console.log('\n🎯 DIFFERENT PURPOSES - DONT MERGE:');
    
    console.log('\n   👥 contacts: Customer contacts saved by businesses');
    console.log('     - Business A saves their customers here');
    console.log('     - Used in customer dashboard');
    console.log('     - Links to chat system (conversations, chat_messages)');
    console.log('     - ✅ KEEP SEPARATE');
    
    console.log('\n   📧 tk_contacts: Business owner info for YOUR pipeline');
    console.log('     - Contact info of business owners YOU want to call');
    console.log('     - Used for pipeline outreach');
    console.log('     - Links to companies for lead generation');
    
    console.log('\n   🔐 client_users: Business owner authentication');
    console.log('     - Business owners who log into their dashboard');
    console.log('     - Google auth, login tracking');
    console.log('     - Links to companies for dashboard access');
    
    console.log('\n🤬 THE REAL PROBLEM:');
    console.log('   ❌ tk_contacts vs client_users OVERLAP');
    console.log('   ❌ Both store business owner info');
    console.log('   ❌ lead_pipeline has DUPLICATE owner fields');
    console.log('   ❌ owner_name, owner_email scattered in multiple places');
    
    console.log('\n🚀 PROFESSIONAL SOLUTION:');
    
    console.log('\n   1️⃣ KEEP contacts (customer dashboard contacts)');
    console.log('     ✅ Different purpose - customer management');
    
    console.log('\n   2️⃣ MERGE tk_contacts + client_users → business_owners');
    console.log('     🎯 Single table for business owner info');
    console.log('     📝 Fields: name, email, company_id, auth_provider, login_data');
    console.log('     🔗 Used for both auth AND pipeline outreach');
    
    console.log('\n   3️⃣ REFERENCE from lead_pipeline');
    console.log('     🗑️  Remove: owner_name, owner_email from lead_pipeline');
    console.log('     ✅ Add: business_owner_id → business_owners.id');
    console.log('     🎯 Single source of truth');
    
    console.log('\n📊 CORRECTED CONSOLIDATION:');
    console.log('   📉 FROM: contacts + tk_contacts + client_users + pipeline owner fields');
    console.log('   📈 TO: contacts + business_owners + pipeline reference');
    console.log('   ✅ Clear separation of customer vs business owner data');
    console.log('   ✅ No duplicate owner info');
    
    console.log('\n🎯 TABLES TO MERGE:');
    console.log('   🔗 tk_contacts + client_users → business_owners');
    console.log('   🗑️  Remove owner_name, owner_email from lead_pipeline');
    console.log('   ✅ Keep contacts separate (different purpose)');
    
  } catch (error) {
    console.error('❌ Analysis error:', error);
  }
}

analyzeContactSystemsCorrectly();