const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function testResetDirect() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Testing direct pipeline reset...');
    
    // Get test leads directly with SQL
    const { rows: testLeads } = await client.query(`
      SELECT lp.id as lead_id, lp.company_id, c.name as company_name
      FROM lead_pipeline lp
      JOIN companies c ON lp.company_id = c.id
      WHERE lp.pipeline_type = 'atlas_test_pipeline';
    `);
    
    console.log(`Found ${testLeads.length} test leads`);
    
    if (testLeads.length === 0) {
      console.log('No test leads to reset');
      return;
    }
    
    const leadIds = testLeads.map(lead => lead.lead_id);
    const companyIds = testLeads.map(lead => lead.company_id);
    
    // Clear all related data
    console.log('Clearing activity logs...');
    await client.query(`DELETE FROM activity_log WHERE lead_id = ANY($1)`, [leadIds]);
    
    console.log('Clearing tags...');
    await client.query(`DELETE FROM lead_tags WHERE lead_id = ANY($1)`, [leadIds]);
    
    console.log('Clearing appointments...');
    await client.query(`DELETE FROM appointments WHERE lead_id = ANY($1)`, [leadIds]);
    
    console.log('Clearing template views...');
    await client.query(`DELETE FROM template_views WHERE company_id = ANY($1)`, [companyIds]);
    
    // Reset leads to new_lead stage
    console.log('Resetting lead stages...');
    await client.query(`
      UPDATE lead_pipeline 
      SET stage = 'new_lead', notes = '', last_contact_date = null, next_follow_up_date = null, updated_at = NOW()
      WHERE id = ANY($1)
    `, [leadIds]);
    
    console.log(`✅ Successfully reset ${testLeads.length} test leads`);
    testLeads.forEach(lead => {
      console.log(`  ${lead.company_name} - reset to new_lead`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testResetDirect();