// Simple Auto-Tagging Test - Direct Database
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Import the auto-tagging function logic
async function autoAddTagsDirect(client, leadId, action) {
  try {
    const tagsToAdd = [];

    // Determine which tags to add based on action
    if (action === 'sms_answer_call_sent') {
      tagsToAdd.push('answered-call');
    } else if (action === 'sms_voicemail_1_sent') {
      tagsToAdd.push('voicemail-left');
    }

    console.log(`🏷️  Action: ${action} -> Tags to add: ${tagsToAdd.join(', ')}`);

    // Add tags via direct database insert
    for (const tagType of tagsToAdd) {
      try {
        // Check if tag already exists
        const { rows: existingTags } = await client.query(`
          SELECT id FROM lead_tags 
          WHERE lead_id = $1 AND tag_type = $2
        `, [leadId, tagType]);

        if (existingTags.length > 0) {
          console.log(`   ⏭️  Tag ${tagType} already exists for lead ${leadId}`);
          continue;
        }

        // Get tag definition
        const { rows: tagDefs } = await client.query(`
          SELECT * FROM tag_definitions WHERE tag_type = $1
        `, [tagType]);

        if (tagDefs.length === 0) {
          console.log(`   ❌ Tag definition not found for ${tagType}`);
          continue;
        }

        const tagDef = tagDefs[0];

        // Add tag directly
        const { rows: insertedTags } = await client.query(`
          INSERT INTO lead_tags (lead_id, tag_type, tag_value, is_auto_generated, created_by, metadata)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `, [
          leadId,
          tagType,
          tagType,
          tagDef.is_auto_tag,
          'system',
          JSON.stringify({ triggeredBy: action, test: true })
        ]);

        if (insertedTags.length > 0) {
          console.log(`   ✅ Auto-added tag: ${tagType} to lead ${leadId}`);
        }
      } catch (error) {
        console.log(`   ❌ Error adding tag ${tagType}:`, error.message);
      }
    }
  } catch (error) {
    console.log('❌ Auto tag addition failed:', error.message);
  }
}

async function testTagging() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Simple Auto-Tagging Test\n');
    
    // Find a test lead
    console.log('📋 Finding test lead...');
    const { rows: testLeads } = await client.query(`
      SELECT lp.id as lead_id, lp.company_id, c.name, c.phone 
      FROM lead_pipeline lp
      JOIN companies c ON c.id = lp.company_id
      WHERE c.phone LIKE '%205-500-5170%' OR c.phone LIKE '%601-613-7813%'
      LIMIT 1
    `);
    
    if (testLeads.length === 0) {
      console.log('❌ No test leads found. Creating a mock test...\n');
      
      // Just test with any lead
      const { rows: anyLeads } = await client.query(`
        SELECT lp.id as lead_id, lp.company_id, c.name, c.phone 
        FROM lead_pipeline lp
        JOIN companies c ON c.id = lp.company_id
        LIMIT 1
      `);
      
      if (anyLeads.length === 0) {
        console.log('❌ No leads found at all');
        return;
      }
      
      testLeads[0] = anyLeads[0];
    }
    
    const testLead = testLeads[0];
    console.log(`✅ Using lead: ${testLead.name} (${testLead.phone})`);
    console.log(`   Lead ID: ${testLead.lead_id}`);
    
    // Check current tags
    console.log('\n🔍 Current tags:');
    const { rows: currentTags } = await client.query(`
      SELECT lt.tag_type, td.display_name, lt.created_at
      FROM lead_tags lt
      JOIN tag_definitions td ON td.tag_type = lt.tag_type
      WHERE lt.lead_id = $1
      ORDER BY lt.created_at DESC
    `, [testLead.lead_id]);
    
    if (currentTags.length === 0) {
      console.log('   (no tags yet)');
    } else {
      currentTags.forEach(tag => {
        console.log(`   - ${tag.display_name} (${new Date(tag.created_at).toLocaleString()})`);
      });
    }
    
    // Test 1: answered-call tag
    console.log('\n📞 Test 1: Adding answered-call tag...');
    await autoAddTagsDirect(client, testLead.lead_id, 'sms_answer_call_sent');
    
    // Test 2: voicemail-left tag
    console.log('\n📧 Test 2: Adding voicemail-left tag...');
    await autoAddTagsDirect(client, testLead.lead_id, 'sms_voicemail_1_sent');
    
    // Final check
    console.log('\n🎯 Final results:');
    const { rows: finalTags } = await client.query(`
      SELECT lt.tag_type, td.display_name, lt.created_at, lt.created_by
      FROM lead_tags lt
      JOIN tag_definitions td ON td.tag_type = lt.tag_type
      WHERE lt.lead_id = $1
      ORDER BY lt.created_at DESC
    `, [testLead.lead_id]);
    
    finalTags.forEach(tag => {
      const isNew = new Date(tag.created_at) > new Date(Date.now() - 60000); // Within last minute
      const icon = isNew ? '🆕' : '📌';
      console.log(`   ${icon} ${tag.display_name} (by: ${tag.created_by})`);
    });
    
    console.log(`\n✅ Test completed! Total tags: ${finalTags.length}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testTagging().catch(console.error);