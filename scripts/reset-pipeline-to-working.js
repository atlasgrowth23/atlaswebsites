const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function resetPipelineToWorking() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Resetting all pipeline leads to working state...\n');
    
    // 1. Reset all leads to new_lead stage
    console.log('1️⃣ Resetting all leads to "new_lead" stage...');
    const resetResult = await client.query(`
      UPDATE lead_pipeline 
      SET 
        stage = 'new_lead',
        last_contact_date = NULL,
        next_follow_up_date = NULL,
        updated_at = NOW()
    `);
    console.log(`✅ Reset ${resetResult.rowCount} leads to new_lead stage`);
    
    // 2. Show pipeline counts
    console.log('\n2️⃣ Current pipeline distribution:');
    const pipelineStats = await client.query(`
      SELECT 
        pipeline_type,
        COUNT(*) as count,
        COUNT(CASE WHEN stage = 'new_lead' THEN 1 END) as new_leads
      FROM lead_pipeline lp
      JOIN companies c ON c.id = lp.company_id
      GROUP BY pipeline_type
      ORDER BY pipeline_type
    `);
    
    pipelineStats.rows.forEach(row => {
      console.log(`  📊 ${row.pipeline_type}: ${row.count} total (${row.new_leads} new leads)`);
    });
    
    // 3. Verify data integrity
    console.log('\n3️⃣ Verifying data integrity...');
    const integrityCheck = await client.query(`
      SELECT 
        COUNT(*) as total_leads,
        COUNT(c.id) as leads_with_companies,
        COUNT(CASE WHEN c.name IS NULL THEN 1 END) as orphaned_leads
      FROM lead_pipeline lp
      LEFT JOIN companies c ON c.id = lp.company_id
    `);
    
    const stats = integrityCheck.rows[0];
    console.log(`  📋 Total leads: ${stats.total_leads}`);
    console.log(`  ✅ Leads with companies: ${stats.leads_with_companies}`);
    console.log(`  ❌ Orphaned leads: ${stats.orphaned_leads}`);
    
    if (stats.orphaned_leads > 0) {
      console.log('\n🧹 Cleaning up orphaned leads...');
      const cleanupResult = await client.query(`
        DELETE FROM lead_pipeline 
        WHERE company_id NOT IN (SELECT id FROM companies)
      `);
      console.log(`✅ Removed ${cleanupResult.rowCount} orphaned leads`);
    }
    
    // 4. Show sample data
    console.log('\n4️⃣ Sample working data:');
    const sample = await client.query(`
      SELECT 
        lp.stage,
        lp.pipeline_type,
        c.name as company_name,
        c.city,
        c.state,
        c.owner_name,
        c.owner_email IS NOT NULL as has_email
      FROM lead_pipeline lp
      JOIN companies c ON c.id = lp.company_id
      WHERE lp.pipeline_type = 'no_website_alabama'
      LIMIT 3
    `);
    
    sample.rows.forEach((row, i) => {
      console.log(`  ${i+1}. ${row.company_name} (${row.city}, ${row.state}) - ${row.stage}`);
      console.log(`     Owner: ${row.owner_name || 'Not set'} | Email: ${row.has_email ? 'Yes' : 'No'}`);
    });
    
    console.log('\n🎉 Pipeline reset complete! All leads are now in "new_lead" stage.');
    console.log('📱 Your pipeline should be working now.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

resetPipelineToWorking().catch(console.error);