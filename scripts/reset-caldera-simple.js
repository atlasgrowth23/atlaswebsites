const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function resetCaldera() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Finding Caldera lead with 205-500-5170...');
    
    // Find the lead ID first
    const findQuery = `
      SELECT lp.id, lp.company_id, c.name, c.phone 
      FROM lead_pipeline lp
      JOIN companies c ON c.id = lp.company_id
      WHERE c.phone LIKE '%205-500-5170%'
      LIMIT 1
    `;
    
    const { rows: leads } = await client.query(findQuery);
    
    if (leads.length === 0) {
      console.log('❌ No lead found with phone 205-500-5170');
      return;
    }
    
    const lead = leads[0];
    console.log(`✅ Found: ${lead.name} (${lead.phone})`);
    console.log(`   Lead ID: ${lead.id}`);
    console.log(`   Company ID: ${lead.company_id}`);
    
    // Delete in order to avoid foreign key issues
    console.log('🗑️  Clearing data...');
    
    // Clear activity log
    await client.query('DELETE FROM activity_log WHERE lead_id = $1', [lead.id]);
    console.log('   ✓ Activity log cleared');
    
    // Clear tags
    await client.query('DELETE FROM lead_tags WHERE lead_id = $1', [lead.id]);
    console.log('   ✓ Tags cleared');
    
    // Clear template views (analytics)
    await client.query('DELETE FROM template_views WHERE company_id = $1', [lead.company_id]);
    console.log('   ✓ Analytics/template views cleared');
    
    // Clear notes (if notes table exists)
    try {
      await client.query('DELETE FROM notes WHERE lead_id = $1', [lead.id]);
      console.log('   ✓ Notes cleared');
    } catch (e) {
      console.log('   ⚠️  Notes table not found (may not exist)');
    }
    
    // Clear appointments (if exists)
    try {
      await client.query('DELETE FROM appointments WHERE company_id = $1', [lead.company_id]);
      console.log('   ✓ Appointments cleared');
    } catch (e) {
      console.log('   ⚠️  Appointments table not found (may not exist)');
    }
    
    // Reset lead to new_lead stage
    console.log('🔄 Resetting lead stage and data...');
    const resetQuery = `
      UPDATE lead_pipeline 
      SET 
        stage = 'new_lead',
        owner_name = NULL,
        owner_email = NULL,
        last_contact_date = NULL,
        next_follow_up_date = NULL,
        notes = '',
        updated_at = NOW()
      WHERE id = $1
    `;
    
    await client.query(resetQuery, [lead.id]);
    console.log('   ✓ Lead reset to new_lead stage');
    
    console.log(`\n🎉 SUCCESS: ${lead.name} has been completely reset!`);
    console.log('   - Stage: new_lead');
    console.log('   - All activity cleared');
    console.log('   - All tags removed');
    console.log('   - Analytics cleared');
    console.log('   - Owner info cleared');
    
  } catch (error) {
    console.error('❌ Reset failed:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

resetCaldera().catch(console.error);