const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function resetLegacyStages() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Resetting legacy pipeline stages to new_lead...');

    // Check current stage distribution
    const beforeCount = await client.query(`
      SELECT stage, COUNT(*) as count 
      FROM lead_pipeline 
      GROUP BY stage 
      ORDER BY count DESC
    `);
    
    console.log('\n📊 Current stage distribution:');
    beforeCount.rows.forEach(row => {
      console.log(`   ${row.stage}: ${row.count} leads`);
    });

    // Reset all non-standard stages to new_lead
    const validStages = ['new_lead', 'live_call', 'voicemail', 'site_viewed', 'appointment', 'sale_made', 'unsuccessful'];
    
    const resetResult = await client.query(`
      UPDATE lead_pipeline 
      SET stage = 'new_lead', updated_at = NOW() 
      WHERE stage NOT IN (${validStages.map((_, i) => `$${i + 1}`).join(',')})
      RETURNING id, stage
    `, validStages);

    console.log(`\n✅ Reset ${resetResult.rows.length} leads to new_lead stage`);

    // Show final distribution
    const afterCount = await client.query(`
      SELECT stage, COUNT(*) as count 
      FROM lead_pipeline 
      GROUP BY stage 
      ORDER BY count DESC
    `);
    
    console.log('\n📊 Final stage distribution:');
    afterCount.rows.forEach(row => {
      console.log(`   ${row.stage}: ${row.count} leads`);
    });

    console.log('\n🎉 Legacy stage reset complete!');

  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

resetLegacyStages().catch(console.error);