const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function resetCalderasLead() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Resetting Calderas Heating and Air lead...');
    
    const leadId = '8293291d-c91f-4113-8789-8a901f57f2d0'; // Calderas lead ID
    
    // Get company info first
    const { rows: leadInfo } = await client.query(`
      SELECT lp.company_id, c.name 
      FROM lead_pipeline lp 
      JOIN companies c ON lp.company_id = c.id 
      WHERE lp.id = $1
    `, [leadId]);
    
    if (leadInfo.length === 0) {
      console.log('❌ Lead not found');
      return;
    }
    
    const companyId = leadInfo[0].company_id;
    const companyName = leadInfo[0].name;
    
    console.log(`📊 Resetting: ${companyName}`);
    
    // Clear all related data
    console.log('🗑️ Clearing activity log...');
    await client.query('DELETE FROM activity_log WHERE lead_id = $1', [leadId]);
    
    console.log('🗑️ Clearing lead tags...');
    await client.query('DELETE FROM lead_tags WHERE lead_id = $1', [leadId]);
    
    console.log('🗑️ Clearing appointments...');
    await client.query('DELETE FROM appointments WHERE lead_id = $1', [leadId]);
    
    console.log('🗑️ Clearing website visits...');
    await client.query('DELETE FROM template_views WHERE company_id = $1', [companyId]);
    
    console.log('🔄 Resetting lead stage...');
    await client.query(`
      UPDATE lead_pipeline 
      SET 
        stage = 'new_lead',
        notes = '',
        last_contact_date = NULL,
        next_follow_up_date = NULL,
        updated_at = NOW()
      WHERE id = $1
    `, [leadId]);
    
    console.log('✅ SUCCESS: Calderas Heating and Air reset to new_lead stage');
    console.log('📞 Phone number: 205-500-5170');
    console.log('🆔 Lead ID: ' + leadId);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

resetCalderasLead().catch(console.error);