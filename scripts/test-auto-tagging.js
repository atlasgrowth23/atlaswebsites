// Test Auto-Tagging System
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testAutoTagging() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing Auto-Tagging System\n');
    
    // Find a test lead (one of your test phone numbers)
    console.log('📋 Finding test lead...');
    const { rows: testLeads } = await client.query(`
      SELECT lp.id as lead_id, lp.company_id, lp.stage, c.name, c.phone 
      FROM lead_pipeline lp
      JOIN companies c ON c.id = lp.company_id
      WHERE c.phone IN ('205-500-5170', '601-613-7813', '(205) 500-5170', '(601) 613-7813')
      LIMIT 1
    `);
    
    if (testLeads.length === 0) {
      console.log('❌ No test leads found with phone numbers 205-500-5170 or 601-613-7813');
      return;
    }
    
    const testLead = testLeads[0];
    console.log(`✅ Using test lead: ${testLead.name} (${testLead.phone}) - Lead ID: ${testLead.lead_id}`);
    
    // Check current tags
    console.log('\n🏷️  Checking current tags...');
    const { rows: currentTags } = await client.query(`
      SELECT lt.tag_type, td.display_name 
      FROM lead_tags lt
      JOIN tag_definitions td ON td.tag_type = lt.tag_type
      WHERE lt.lead_id = $1
    `, [testLead.lead_id]);
    
    console.log(`Current tags (${currentTags.length}):`, currentTags.map(t => t.display_name).join(', ') || 'None');
    
    // Test 1: Simulate SMS Answer Call activity (should add answered-call tag)
    console.log('\n📞 Test 1: Simulating SMS Answer Call...');
    await client.query(`
      INSERT INTO activity_log (lead_id, company_id, user_name, action, action_data)
      VALUES ($1, $2, 'test-user', 'sms_answer_call_sent', '{"test": true}')
    `, [testLead.lead_id, testLead.company_id]);
    
    // Manually trigger the auto-tagging function by calling the API endpoint
    console.log('⚡ Triggering auto-tag logic...');
    const response = await fetch(`http://localhost:3000/api/activity/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: testLead.lead_id,
        companyId: testLead.company_id,
        userName: 'test-user',
        action: 'sms_answer_call_sent',
        actionData: { test: true }
      })
    });
    
    if (response.ok) {
      console.log('✅ Activity tracked successfully');
    } else {
      console.log('❌ Activity tracking failed:', await response.text());
    }
    
    // Check if answered-call tag was added
    console.log('\n🔍 Checking for answered-call tag...');
    const { rows: answeredCallTags } = await client.query(`
      SELECT lt.*, td.display_name 
      FROM lead_tags lt
      JOIN tag_definitions td ON td.tag_type = lt.tag_type
      WHERE lt.lead_id = $1 AND lt.tag_type = 'answered-call'
    `, [testLead.lead_id]);
    
    if (answeredCallTags.length > 0) {
      console.log('✅ answered-call tag successfully added!');
    } else {
      console.log('❌ answered-call tag was NOT added');
    }
    
    // Test 2: Simulate voicemail SMS (should add voicemail-left tag)
    console.log('\n📧 Test 2: Simulating Voicemail SMS...');
    await client.query(`
      INSERT INTO activity_log (lead_id, company_id, user_name, action, action_data)
      VALUES ($1, $2, 'test-user', 'sms_voicemail_1_sent', '{"test": true}')
    `, [testLead.lead_id, testLead.company_id]);
    
    const voicemailResponse = await fetch(`http://localhost:3000/api/activity/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: testLead.lead_id,
        companyId: testLead.company_id,
        userName: 'test-user',
        action: 'sms_voicemail_1_sent',
        actionData: { test: true }
      })
    });
    
    if (voicemailResponse.ok) {
      console.log('✅ Voicemail activity tracked successfully');
    } else {
      console.log('❌ Voicemail activity tracking failed');
    }
    
    // Check if voicemail-left tag was added
    console.log('\n🔍 Checking for voicemail-left tag...');
    const { rows: voicemailTags } = await client.query(`
      SELECT lt.*, td.display_name 
      FROM lead_tags lt
      JOIN tag_definitions td ON td.tag_type = lt.tag_type
      WHERE lt.lead_id = $1 AND lt.tag_type = 'voicemail-left'
    `, [testLead.lead_id]);
    
    if (voicemailTags.length > 0) {
      console.log('✅ voicemail-left tag successfully added!');
    } else {
      console.log('❌ voicemail-left tag was NOT added');
    }
    
    // Final summary
    console.log('\n📊 Final tag summary:');
    const { rows: finalTags } = await client.query(`
      SELECT lt.tag_type, td.display_name, lt.created_at
      FROM lead_tags lt
      JOIN tag_definitions td ON td.tag_type = lt.tag_type
      WHERE lt.lead_id = $1
      ORDER BY lt.created_at DESC
    `, [testLead.lead_id]);
    
    finalTags.forEach(tag => {
      console.log(`- ${tag.display_name} (${tag.tag_type}) - ${new Date(tag.created_at).toLocaleString()}`);
    });
    
    console.log(`\n✅ Test completed! ${finalTags.length} total tags found.`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testAutoTagging().catch(console.error);