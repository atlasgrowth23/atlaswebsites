const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function resetAllLeads() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Moving all pipeline leads back to new_lead stage...');
    
    // First, check current stage distribution
    const currentStagesResult = await client.query(`
      SELECT stage, COUNT(*) as count 
      FROM pipeline_leads 
      GROUP BY stage 
      ORDER BY count DESC
    `);
    
    console.log('\n📊 Current stage distribution:');
    currentStagesResult.rows.forEach(row => {
      console.log(`  ${row.stage}: ${row.count} leads`);
    });
    
    // Move all leads to new_lead stage
    const updateResult = await client.query(`
      UPDATE pipeline_leads 
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
    
    console.log(`\n✅ Updated ${updateResult.rows.length} leads to new_lead stage`);
    
    // Verify the update
    const verifyResult = await client.query(`
      SELECT stage, COUNT(*) as count 
      FROM pipeline_leads 
      GROUP BY stage 
      ORDER BY count DESC
    `);
    
    console.log('\n📊 Updated stage distribution:');
    verifyResult.rows.forEach(row => {
      console.log(`  ${row.stage}: ${row.count} leads`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

resetAllLeads().catch(console.error);