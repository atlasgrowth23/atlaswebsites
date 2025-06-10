const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function analyzeLogPipelineRelationships() {
  const client = await pool.connect();
  
  try {
    console.log('📊 LOG TABLES vs PIPELINE RELATIONSHIP ANALYSIS');
    console.log('='.repeat(70));
    
    // 1. How does contact_log relate to lead_pipeline?
    console.log('\n🔍 CONTACT_LOG vs LEAD_PIPELINE RELATIONSHIP:');
    
    // Check if contact_log company_ids exist in lead_pipeline
    const contactLogCompanies = await client.query(`
      SELECT DISTINCT cl.company_id, c.name as company_name
      FROM contact_log cl
      LEFT JOIN companies c ON cl.company_id = c.id
      LIMIT 10
    `);
    
    console.log('\n📋 CONTACT_LOG COMPANIES:');
    for (const company of contactLogCompanies.rows) {
      const inPipeline = await client.query(`
        SELECT stage FROM lead_pipeline WHERE company_id = $1
      `, [company.company_id]);
      
      console.log(`   ${company.company_name}: ${inPipeline.rows.length > 0 ? '✅ In Pipeline (' + inPipeline.rows[0].stage + ')' : '❌ NOT in Pipeline'}`);
    }
    
    // 2. How does activity_log relate to lead_pipeline?
    console.log('\n🔍 ACTIVITY_LOG vs LEAD_PIPELINE RELATIONSHIP:');
    
    // Check lead_id vs company_id usage in activity_log
    const activityStats = await client.query(`
      SELECT 
        COUNT(*) as total_activities,
        COUNT(lead_id) as activities_with_lead_id,
        COUNT(company_id) as activities_with_company_id,
        COUNT(CASE WHEN lead_id IS NOT NULL AND company_id IS NOT NULL THEN 1 END) as activities_with_both
      FROM activity_log
    `);
    
    const stats = activityStats.rows[0];
    console.log(`\n📊 ACTIVITY_LOG STATISTICS:`);
    console.log(`   Total activities: ${stats.total_activities}`);
    console.log(`   With lead_id: ${stats.activities_with_lead_id}`);
    console.log(`   With company_id: ${stats.activities_with_company_id}`);
    console.log(`   With both: ${stats.activities_with_both}`);
    
    // 3. Check if activity_log lead_ids match lead_pipeline ids
    console.log('\n🔍 DO ACTIVITY_LOG LEAD_IDS MATCH LEAD_PIPELINE?');
    const activityLeads = await client.query(`
      SELECT DISTINCT lead_id 
      FROM activity_log 
      WHERE lead_id IS NOT NULL 
      LIMIT 10
    `);
    
    for (const activity of activityLeads.rows) {
      const leadExists = await client.query(`
        SELECT lp.id, lp.stage, c.name as company_name
        FROM lead_pipeline lp
        LEFT JOIN companies c ON lp.company_id = c.id
        WHERE lp.id = $1
      `, [activity.lead_id]);
      
      if (leadExists.rows.length > 0) {
        const lead = leadExists.rows[0];
        console.log(`   ✅ ${activity.lead_id}: ${lead.company_name} (${lead.stage})`);
      } else {
        console.log(`   ❌ ${activity.lead_id}: ORPHANED - no matching lead_pipeline`);
      }
    }
    
    // 4. Are contact_log and activity_log tracking the same things?
    console.log('\n🤔 OVERLAP ANALYSIS - ARE THESE REDUNDANT?');
    
    // Check stage changes in both logs
    const contactStageChanges = await client.query(`
      SELECT stage_to, COUNT(*) as count
      FROM contact_log 
      GROUP BY stage_to
      ORDER BY count DESC
    `);
    
    const activityStageChanges = await client.query(`
      SELECT action, COUNT(*) as count
      FROM activity_log 
      WHERE action ILIKE '%stage%' OR action ILIKE '%move%'
      GROUP BY action
      ORDER BY count DESC
    `);
    
    console.log('\n📋 STAGE CHANGES IN CONTACT_LOG:');
    contactStageChanges.rows.forEach(row => {
      console.log(`   ${row.stage_to}: ${row.count} times`);
    });
    
    console.log('\n📋 STAGE CHANGES IN ACTIVITY_LOG:');
    if (activityStageChanges.rows.length > 0) {
      activityStageChanges.rows.forEach(row => {
        console.log(`   ${row.action}: ${row.count} times`);
      });
    } else {
      console.log('   ❌ No stage-related activities found');
    }
    
    // 5. Data quality issues
    console.log('\n⚠️ DATA QUALITY ISSUES:');
    
    // Orphaned contact_log entries
    const orphanedContacts = await client.query(`
      SELECT COUNT(*) as count
      FROM contact_log cl
      LEFT JOIN companies c ON cl.company_id = c.id
      WHERE c.id IS NULL
    `);
    
    console.log(`   Orphaned contact_log entries: ${orphanedContacts.rows[0].count}`);
    
    // Orphaned activity_log entries
    const orphanedActivities = await client.query(`
      SELECT COUNT(*) as count
      FROM activity_log al
      LEFT JOIN lead_pipeline lp ON al.lead_id = lp.id
      WHERE al.lead_id IS NOT NULL AND lp.id IS NULL
    `);
    
    console.log(`   Orphaned activity_log entries: ${orphanedActivities.rows[0].count}`);
    
    // 6. Recommendations
    console.log('\n🎯 CLEANUP RECOMMENDATIONS:');
    
    if (contactStageChanges.rows.length > 0 && activityStageChanges.rows.length === 0) {
      console.log('   📋 contact_log tracks stage changes, activity_log tracks actions');
      console.log('   ✅ Both tables serve different purposes - KEEP BOTH');
    } else if (contactStageChanges.rows.length === 0) {
      console.log('   ❌ contact_log has no stage changes - might be REDUNDANT');
    } else {
      console.log('   ⚠️ Both tables track stage changes - POTENTIAL REDUNDANCY');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

analyzeLogPipelineRelationships();