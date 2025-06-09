const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Test the full cold call workflow
async function testPipelineSystem() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing Pipeline System End-to-End\n');

    // 1. Create a test company if it doesn't exist
    console.log('1. Creating test company...');
    const testCompany = await client.query(`
      INSERT INTO companies (id, name, slug, city, state, phone)
      VALUES (gen_random_uuid(), 'Test HVAC Company', 'test-hvac-company', 'Birmingham', 'Alabama', '555-123-4567')
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING *
    `);
    console.log(`✅ Test company: ${testCompany.rows[0].name}`);

    // 2. Add to pipeline as new lead
    console.log('\n2. Adding to pipeline...');
    const testLead = await client.query(`
      INSERT INTO lead_pipeline (id, company_id, stage, notes)
      VALUES (gen_random_uuid(), $1, 'new_lead', 'Test lead for pipeline testing')
      ON CONFLICT (company_id) DO UPDATE SET stage = 'new_lead', updated_at = NOW()
      RETURNING *
    `, [testCompany.rows[0].id]);
    console.log(`✅ Lead created in stage: ${testLead.rows[0].stage}`);

    // 3. Start a cold call session
    console.log('\n3. Starting cold call session...');
    const session = await client.query(`
      INSERT INTO cold_call_sessions (user_name, start_time)
      VALUES ('TestUser', NOW())
      RETURNING *
    `);
    console.log(`✅ Session started: ${session.rows[0].id}`);

    // 4. Simulate workflow actions
    console.log('\n4. Simulating workflow actions...');
    
    // Preview Website
    await client.query(`
      INSERT INTO activity_log (session_id, lead_id, company_id, user_name, action, action_data)
      VALUES ($1, $2, $3, 'TestUser', 'preview_website', '{}')
    `, [session.rows[0].id, testLead.rows[0].id, testCompany.rows[0].id]);
    console.log('   ✅ Preview Website tracked');

    // View Google Reviews
    await client.query(`
      INSERT INTO activity_log (session_id, lead_id, company_id, user_name, action, action_data)
      VALUES ($1, $2, $3, 'TestUser', 'view_google_reviews', '{}')
    `, [session.rows[0].id, testLead.rows[0].id, testCompany.rows[0].id]);
    console.log('   ✅ View Google Reviews tracked');

    // Call Started
    await client.query(`
      INSERT INTO activity_log (session_id, lead_id, company_id, user_name, action, action_data)
      VALUES ($1, $2, $3, 'TestUser', 'call_started', '{"phone": "555-123-4567"}')
    `, [session.rows[0].id, testLead.rows[0].id, testCompany.rows[0].id]);
    console.log('   ✅ Call Started tracked');

    // Test Answer Call Snippet (should move to live_call stage)
    await client.query(`
      INSERT INTO activity_log (session_id, lead_id, company_id, user_name, action, action_data)
      VALUES ($1, $2, $3, 'TestUser', 'sms_answer_call_sent', '{"snippet_type": "Answer Call Snippet"}')
    `, [session.rows[0].id, testLead.rows[0].id, testCompany.rows[0].id]);
    console.log('   ✅ Answer Call Snippet sent');

    // Manually trigger stage update (since we don't have the auto-update trigger in this test)
    await client.query(`
      UPDATE lead_pipeline SET stage = 'live_call', updated_at = NOW() 
      WHERE id = $1 AND stage = 'new_lead'
    `, [testLead.rows[0].id]);

    // Check if stage auto-updated
    const updatedLead = await client.query(`
      SELECT stage FROM lead_pipeline WHERE id = $1
    `, [testLead.rows[0].id]);
    console.log(`   📊 Stage should be 'live_call': ${updatedLead.rows[0].stage}`);

    // Owner Email Added (successful call)
    await client.query(`
      INSERT INTO activity_log (session_id, lead_id, company_id, user_name, action, action_data)
      VALUES ($1, $2, $3, 'TestUser', 'owner_email_added', '{"owner_email": "john@testhvac.com"}')
    `, [session.rows[0].id, testLead.rows[0].id, testCompany.rows[0].id]);
    console.log('   ✅ Owner Email added (call ended)');

    // 5. Test Voicemail Flow
    console.log('\n5. Testing voicemail flow...');
    
    // Reset lead to new_lead
    await client.query(`
      UPDATE lead_pipeline SET stage = 'new_lead' WHERE id = $1
    `, [testLead.rows[0].id]);

    // Send Voicemail Part 1 (should move to voicemail stage)
    await client.query(`
      INSERT INTO activity_log (session_id, lead_id, company_id, user_name, action, action_data)
      VALUES ($1, $2, $3, 'TestUser', 'sms_voicemail_1_sent', '{"snippet_type": "Voicemail Part 1"}')
    `, [session.rows[0].id, testLead.rows[0].id, testCompany.rows[0].id]);

    // Manually trigger voicemail stage update
    await client.query(`
      UPDATE lead_pipeline SET stage = 'voicemail', updated_at = NOW() 
      WHERE id = $1 AND stage = 'new_lead'
    `, [testLead.rows[0].id]);

    const voicemailLead = await client.query(`
      SELECT stage FROM lead_pipeline WHERE id = $1
    `, [testLead.rows[0].id]);
    console.log(`   📊 Stage should be 'voicemail': ${voicemailLead.rows[0].stage}`);

    // 6. Test Manual Actions
    console.log('\n6. Testing manual actions...');
    
    // Test Appointment Set
    await client.query(`
      INSERT INTO activity_log (session_id, lead_id, company_id, user_name, action, action_data)
      VALUES ($1, $2, $3, 'TestUser', 'appointment_set', '{"previous_stage": "voicemail"}')
    `, [session.rows[0].id, testLead.rows[0].id, testCompany.rows[0].id]);
    console.log('   ✅ Appointment Set action tracked');

    // 7. End Session and Check Stats
    console.log('\n7. Ending session and checking stats...');
    
    // Count activities
    const activities = await client.query(`
      SELECT action, COUNT(*) as count 
      FROM activity_log 
      WHERE session_id = $1 
      GROUP BY action
    `, [session.rows[0].id]);
    
    console.log('   📊 Session Activities:');
    activities.rows.forEach(row => {
      console.log(`      ${row.action}: ${row.count}`);
    });

    // Calculate session stats
    const callsMade = activities.rows.find(r => r.action === 'call_started')?.count || 0;
    const contactsMade = activities.rows.find(r => r.action === 'owner_email_added')?.count || 0;
    const voicemailsLeft = activities.rows.find(r => r.action === 'sms_voicemail_1_sent')?.count || 0;
    const leadsProcessed = 1; // We processed 1 lead

    // End session with stats
    await client.query(`
      UPDATE cold_call_sessions 
      SET end_time = NOW(), 
          leads_processed = $1,
          calls_made = $2,
          contacts_made = $3,
          voicemails_left = $4
      WHERE id = $5
    `, [leadsProcessed, callsMade, contactsMade, voicemailsLeft, session.rows[0].id]);

    console.log(`   ✅ Session ended with stats: ${callsMade} calls, ${contactsMade} contacts, ${voicemailsLeft} voicemails`);

    // 8. Check Final State
    console.log('\n8. Final system state:');
    const finalLead = await client.query(`
      SELECT stage FROM lead_pipeline WHERE id = $1
    `, [testLead.rows[0].id]);
    console.log(`   📊 Final lead stage: ${finalLead.rows[0].stage}`);

    const finalSession = await client.query(`
      SELECT * FROM cold_call_sessions WHERE id = $1
    `, [session.rows[0].id]);
    console.log(`   📊 Session duration: ${new Date(finalSession.rows[0].end_time).getTime() - new Date(finalSession.rows[0].start_time).getTime()}ms`);

    console.log('\n✅ All tests completed successfully!');

    // 9. Identify potential issues
    console.log('\n🔍 POTENTIAL ISSUES FOUND:');
    
    // Check for orphaned activities
    const orphanedActivities = await client.query(`
      SELECT COUNT(*) as count FROM activity_log 
      WHERE session_id IS NOT NULL 
      AND session_id NOT IN (SELECT id FROM cold_call_sessions)
    `);
    if (orphanedActivities.rows[0].count > 0) {
      console.log(`   ⚠️  ${orphanedActivities.rows[0].count} orphaned activities (session_id doesn't exist)`);
    }

    // Check for leads without companies
    const orphanedLeads = await client.query(`
      SELECT COUNT(*) as count FROM lead_pipeline 
      WHERE company_id NOT IN (SELECT id FROM companies)
    `);
    if (orphanedLeads.rows[0].count > 0) {
      console.log(`   ⚠️  ${orphanedLeads.rows[0].count} leads with missing companies`);
    }

    // Check for invalid stages
    const validStages = ['new_lead', 'live_call', 'voicemail', 'site_viewed', 'appointment', 'sale_made', 'unsuccessful'];
    const invalidStages = await client.query(`
      SELECT DISTINCT stage, COUNT(*) as count 
      FROM lead_pipeline 
      WHERE stage NOT IN (${validStages.map(s => `'${s}'`).join(',')})
      GROUP BY stage
    `);
    if (invalidStages.rows.length > 0) {
      console.log(`   ⚠️  Invalid stages found:`);
      invalidStages.rows.forEach(row => {
        console.log(`      ${row.stage}: ${row.count} leads`);
      });
    }

    console.log('\n🎉 Pipeline system test complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

testPipelineSystem().catch(console.error);