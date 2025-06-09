const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkTestLeads() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking test leads...');
    
    // Check all pipeline types
    const { rows: pipelineTypes } = await client.query(`
      SELECT pipeline_type, COUNT(*) as count
      FROM lead_pipeline 
      GROUP BY pipeline_type
      ORDER BY count DESC;
    `);
    
    console.log('📊 Pipeline types:');
    pipelineTypes.forEach(row => {
      console.log(`  ${row.pipeline_type}: ${row.count} leads`);
    });
    
    // Check specifically for atlas_test_pipeline
    const { rows: testLeads } = await client.query(`
      SELECT id, company_id, stage 
      FROM lead_pipeline 
      WHERE pipeline_type = 'atlas_test_pipeline'
      LIMIT 5;
    `);
    
    console.log(`\n🎯 Test pipeline leads: ${testLeads.length}`);
    testLeads.forEach(lead => {
      console.log(`  Lead ${lead.id}: Company ${lead.company_id}, Stage: ${lead.stage}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTestLeads();