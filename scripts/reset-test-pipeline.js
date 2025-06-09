const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function resetTestPipeline() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Resetting Test Pipeline...\n');

    // Get all test leads
    const testLeads = await client.query(`
      SELECT lp.id as lead_id, lp.company_id, c.name
      FROM lead_pipeline lp
      JOIN companies c ON lp.company_id = c.id
      WHERE lp.pipeline_type = 'atlas_test_pipeline'
    `);

    console.log(`📊 Found ${testLeads.rows.length} test leads to reset`);

    if (testLeads.rows.length === 0) {
      console.log('❌ No test leads found');
      return;
    }

    const leadIds = testLeads.rows.map(row => row.lead_id);
    const companyIds = testLeads.rows.map(row => row.company_id);

    // 1. Clear all activity logs
    console.log('\n🧹 Clearing activity logs...');
    const activityResult = await client.query(`
      DELETE FROM activity_log WHERE lead_id = ANY($1)
    `, [leadIds]);
    console.log(`   ✅ Removed ${activityResult.rowCount} activity log entries`);

    // 2. Clear all tags
    console.log('\n🏷️ Clearing tags...');
    const tagsResult = await client.query(`
      DELETE FROM lead_tags WHERE lead_id = ANY($1)
    `, [leadIds]);
    console.log(`   ✅ Removed ${tagsResult.rowCount} tags`);

    // 3. Clear appointments
    console.log('\n📅 Clearing appointments...');
    const appointmentsResult = await client.query(`
      DELETE FROM appointments WHERE lead_id = ANY($1)
    `, [leadIds]);
    console.log(`   ✅ Removed ${appointmentsResult.rowCount} appointments`);

    // 4. Clear template views (website visits)
    console.log('\n👁️ Clearing website visits...');
    const viewsResult = await client.query(`
      DELETE FROM template_views WHERE company_id = ANY($1)
    `, [companyIds]);
    console.log(`   ✅ Removed ${viewsResult.rowCount} website visits`);

    // 5. Reset all leads to 'new_lead' stage
    console.log('\n➡️ Resetting pipeline stages...');
    const stageResult = await client.query(`
      UPDATE lead_pipeline 
      SET 
        stage = 'new_lead',
        notes = '',
        last_contact_date = NULL,
        next_follow_up_date = NULL,
        updated_at = NOW()
      WHERE id = ANY($1)
    `, [leadIds]);
    console.log(`   ✅ Reset ${stageResult.rowCount} leads to 'new_lead' stage`);

    // 6. Clear any contact logs
    console.log('\n📞 Clearing contact logs...');
    const contactResult = await client.query(`
      DELETE FROM contact_log WHERE company_id = ANY($1)
    `, [companyIds]);
    console.log(`   ✅ Removed ${contactResult.rowCount} contact log entries`);

    // 7. Reset company tracking
    console.log('\n📊 Resetting company tracking...');
    await client.query(`
      UPDATE companies 
      SET 
        tracking_enabled = true,
        tracking_paused = false
      WHERE id = ANY($1)
    `, [companyIds]);

    // Show final status
    console.log('\n✅ TEST PIPELINE RESET COMPLETE!');
    console.log('\n📋 Reset Summary:');
    testLeads.rows.forEach(lead => {
      console.log(`   🟢 ${lead.name} → Ready for testing`);
    });

    console.log('\n🎯 All test leads are now:');
    console.log('   • Stage: new_lead');
    console.log('   • Activity: Cleared');
    console.log('   • Tags: Removed');
    console.log('   • Appointments: Cleared');
    console.log('   • Website visits: Cleared');
    console.log('   • Ready for fresh testing!');
    
  } catch (error) {
    console.error('❌ Reset failed:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

resetTestPipeline().catch(console.error);