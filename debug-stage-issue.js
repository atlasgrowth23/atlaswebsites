const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function debugStageIssue() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Debugging stage disconnect issue...');
    
    // Check what stages exist in each pipeline
    const stagesByPipeline = await client.query(`
      SELECT pipeline_type, stage, COUNT(*) as count
      FROM lead_pipeline
      WHERE pipeline_type IS NOT NULL
      GROUP BY pipeline_type, stage
      ORDER BY pipeline_type, stage
    `);
    
    console.log('\n📋 Stages by pipeline:');
    let currentPipeline = '';
    stagesByPipeline.rows.forEach(row => {
      if (row.pipeline_type !== currentPipeline) {
        console.log(`\n  📂 ${row.pipeline_type}:`);
        currentPipeline = row.pipeline_type;
      }
      console.log(`    "${row.stage}": ${row.count} entries`);
    });
    
    // Check sample entries to see if they look correct
    console.log('\n🔍 Sample entries:');
    const sampleEntries = await client.query(`
      SELECT lp.pipeline_type, lp.stage, c.name, c.state, c.site
      FROM lead_pipeline lp
      JOIN companies c ON lp.company_id = c.id
      WHERE lp.pipeline_type = 'no_website_alabama'
      LIMIT 5
    `);
    
    sampleEntries.rows.forEach(entry => {
      console.log(`  ${entry.name} (${entry.state}): Stage "${entry.stage}" | Site: ${entry.site || 'NULL'}`);
    });
    
    // Test the exact query the API would use
    console.log('\n🧪 Testing API query...');
    const apiTestQuery = await client.query(`
      SELECT lp.*, c.name, c.state, c.site
      FROM lead_pipeline lp
      JOIN companies c ON lp.company_id = c.id
      WHERE lp.pipeline_type = 'no_website_alabama'
      LIMIT 3
    `);
    
    console.log('API query results:');
    apiTestQuery.rows.forEach((row, i) => {
      console.log(`  ${i+1}. ${row.name}: "${row.stage}" in ${row.pipeline_type}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

debugStageIssue().catch(console.error);