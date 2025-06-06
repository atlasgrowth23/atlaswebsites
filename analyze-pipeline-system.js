const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function analyzePipelineSystem() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Analyzing current pipeline system...');
    
    // 1. Check how the API filters companies
    console.log('\n1️⃣ COMPANIES BY WEBSITE STATUS:');
    
    const companiesWithSites = await client.query(`
      SELECT state, COUNT(*) as count
      FROM companies 
      WHERE state IN ('Alabama', 'Arkansas') 
        AND site IS NOT NULL 
        AND site != ''
      GROUP BY state
      ORDER BY state
    `);
    
    const companiesWithoutSites = await client.query(`
      SELECT state, COUNT(*) as count
      FROM companies 
      WHERE state IN ('Alabama', 'Arkansas') 
        AND (site IS NULL OR site = '')
      GROUP BY state
      ORDER BY state
    `);
    
    console.log('Companies WITH existing websites:');
    companiesWithSites.rows.forEach(row => {
      console.log(`  ${row.state}: ${row.count} companies`);
    });
    
    console.log('Companies WITHOUT websites (pipeline eligible):');
    companiesWithoutSites.rows.forEach(row => {
      console.log(`  ${row.state}: ${row.count} companies`);
    });
    
    // 2. Check lead_pipeline entries vs eligible companies
    console.log('\n2️⃣ PIPELINE ENTRIES VS ELIGIBLE COMPANIES:');
    
    const pipelineByState = await client.query(`
      SELECT c.state, COUNT(lp.id) as pipeline_entries
      FROM companies c
      LEFT JOIN lead_pipeline lp ON c.id = lp.company_id
      WHERE c.state IN ('Alabama', 'Arkansas') 
        AND (c.site IS NULL OR c.site = '')
        AND lp.id IS NOT NULL
      GROUP BY c.state
      ORDER BY c.state
    `);
    
    console.log('Pipeline entries by state:');
    pipelineByState.rows.forEach(row => {
      console.log(`  ${row.state}: ${row.pipeline_entries} entries`);
    });
    
    // 3. Check current stage distribution
    console.log('\n3️⃣ CURRENT STAGE DISTRIBUTION:');
    
    const stageDistribution = await client.query(`
      SELECT lp.stage, COUNT(*) as count
      FROM lead_pipeline lp
      GROUP BY lp.stage
      ORDER BY count DESC
    `);
    
    stageDistribution.rows.forEach(row => {
      console.log(`  ${row.stage}: ${row.count} entries`);
    });
    
    // 4. Sample recent entries to understand the data
    console.log('\n4️⃣ SAMPLE RECENT PIPELINE ENTRIES:');
    
    const sampleEntries = await client.query(`
      SELECT lp.stage, c.name, c.state, c.site, lp.updated_at
      FROM lead_pipeline lp
      JOIN companies c ON lp.company_id = c.id
      ORDER BY lp.updated_at DESC
      LIMIT 10
    `);
    
    sampleEntries.rows.forEach(entry => {
      const site = entry.site || 'NO SITE';
      const date = entry.updated_at.toISOString().split('T')[0];
      console.log(`  ${entry.name} (${entry.state}): ${entry.stage} | Site: ${site} | ${date}`);
    });
    
    // 5. Check if there are companies with sites in the pipeline (shouldn't be)
    console.log('\n5️⃣ COMPANIES WITH SITES IN PIPELINE (SHOULD BE ZERO):');
    
    const companiesWithSitesInPipeline = await client.query(`
      SELECT COUNT(*) as count
      FROM lead_pipeline lp
      JOIN companies c ON lp.company_id = c.id
      WHERE c.site IS NOT NULL AND c.site != ''
    `);
    
    console.log(`Companies with existing sites incorrectly in pipeline: ${companiesWithSitesInPipeline.rows[0].count}`);
    
    console.log('\n📊 ANALYSIS COMPLETE');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

analyzePipelineSystem().catch(console.error);