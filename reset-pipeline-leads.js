const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function resetPipelineLeads() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Resetting all pipeline leads to new_lead stage...');
    
    // Show current distribution
    const beforeResult = await client.query(`
      SELECT stage, COUNT(*) as count 
      FROM lead_pipeline 
      GROUP BY stage 
      ORDER BY count DESC
    `);
    
    console.log('\n📊 Before reset:');
    beforeResult.rows.forEach(row => {
      console.log(`  ${row.stage}: ${row.count} entries`);
    });
    
    // Reset all to new_lead stage
    const updateResult = await client.query(`
      UPDATE lead_pipeline 
      SET 
        stage = 'new_lead',
        updated_at = NOW(),
        notes = CASE 
          WHEN notes = '' OR notes IS NULL THEN 'Reset to new lead stage'
          ELSE notes || ' | Reset to new lead stage'
        END
      WHERE stage != 'new_lead'
      RETURNING id, stage
    `);
    
    console.log(`\n✅ Updated ${updateResult.rows.length} pipeline entries to new_lead stage`);
    
    // Show updated distribution
    const afterResult = await client.query(`
      SELECT stage, COUNT(*) as count 
      FROM lead_pipeline 
      GROUP BY stage 
      ORDER BY count DESC
    `);
    
    console.log('\n📊 After reset:');
    afterResult.rows.forEach(row => {
      console.log(`  ${row.stage}: ${row.count} entries`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

resetPipelineLeads().catch(console.error);