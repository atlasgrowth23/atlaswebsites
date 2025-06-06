const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function organizePipelineData() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Organizing pipeline data into 4 separate pipelines...');
    
    // Step 1: Delete entries for companies that have websites (shouldn't be in pipeline)
    console.log('\n1️⃣ Removing companies with existing websites from pipeline...');
    
    const deleteResult = await client.query(`
      DELETE FROM lead_pipeline lp
      USING companies c
      WHERE lp.company_id = c.id
        AND c.site IS NOT NULL 
        AND c.site != ''
      RETURNING lp.id
    `);
    
    console.log(`✅ Removed ${deleteResult.rows.length} companies with existing websites`);
    
    // Step 2: Assign pipeline_type to remaining entries
    console.log('\n2️⃣ Assigning pipeline types to remaining entries...');
    
    // Alabama - No Website
    const alabamaNoSiteResult = await client.query(`
      UPDATE lead_pipeline lp
      SET pipeline_type = 'no_website_alabama'
      FROM companies c
      WHERE lp.company_id = c.id
        AND c.state = 'Alabama'
        AND (c.site IS NULL OR c.site = '')
        AND lp.pipeline_type IS NULL
      RETURNING lp.id
    `);
    
    console.log(`✅ Alabama (No Website): ${alabamaNoSiteResult.rows.length} entries`);
    
    // Arkansas - No Website  
    const arkansasNoSiteResult = await client.query(`
      UPDATE lead_pipeline lp
      SET pipeline_type = 'no_website_arkansas'
      FROM companies c
      WHERE lp.company_id = c.id
        AND c.state = 'Arkansas'
        AND (c.site IS NULL OR c.site = '')
        AND lp.pipeline_type IS NULL
      RETURNING lp.id
    `);
    
    console.log(`✅ Arkansas (No Website): ${arkansasNoSiteResult.rows.length} entries`);
    
    // Step 3: Create entries for companies WITH websites that aren't in pipeline yet
    console.log('\n3️⃣ Adding companies with existing websites to appropriate pipelines...');
    
    // Alabama - Has Website
    const alabamaWithSiteResult = await client.query(`
      INSERT INTO lead_pipeline (company_id, stage, pipeline_type, notes, created_at, updated_at)
      SELECT 
        c.id,
        'new_lead',
        'has_website_alabama',
        'Company has existing website - different workflow',
        NOW(),
        NOW()
      FROM companies c
      LEFT JOIN lead_pipeline lp ON c.id = lp.company_id
      WHERE c.state = 'Alabama'
        AND c.site IS NOT NULL 
        AND c.site != ''
        AND lp.id IS NULL
      RETURNING id
    `);
    
    console.log(`✅ Alabama (Has Website): ${alabamaWithSiteResult.rows.length} new entries`);
    
    // Arkansas - Has Website
    const arkansasWithSiteResult = await client.query(`
      INSERT INTO lead_pipeline (company_id, stage, pipeline_type, notes, created_at, updated_at)
      SELECT 
        c.id,
        'new_lead',
        'has_website_arkansas',
        'Company has existing website - different workflow',
        NOW(),
        NOW()
      FROM companies c
      LEFT JOIN lead_pipeline lp ON c.id = lp.company_id
      WHERE c.state = 'Arkansas'
        AND c.site IS NOT NULL 
        AND c.site != ''
        AND lp.id IS NULL
      RETURNING id
    `);
    
    console.log(`✅ Arkansas (Has Website): ${arkansasWithSiteResult.rows.length} new entries`);
    
    // Step 4: Verify the final distribution
    console.log('\n4️⃣ Final pipeline distribution:');
    
    const finalDistribution = await client.query(`
      SELECT pipeline_type, COUNT(*) as count
      FROM lead_pipeline
      GROUP BY pipeline_type
      ORDER BY pipeline_type
    `);
    
    finalDistribution.rows.forEach(row => {
      console.log(`  ${row.pipeline_type}: ${row.count} entries`);
    });
    
    // Step 5: Verify stages distribution within each pipeline
    console.log('\n5️⃣ Stage distribution by pipeline:');
    
    const stageDistribution = await client.query(`
      SELECT pipeline_type, stage, COUNT(*) as count
      FROM lead_pipeline
      GROUP BY pipeline_type, stage
      ORDER BY pipeline_type, stage
    `);
    
    let currentPipeline = '';
    stageDistribution.rows.forEach(row => {
      if (row.pipeline_type !== currentPipeline) {
        console.log(`\n  📋 ${row.pipeline_type}:`);
        currentPipeline = row.pipeline_type;
      }
      console.log(`    ${row.stage}: ${row.count}`);
    });
    
    console.log('\n✅ Pipeline data organization complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

organizePipelineData().catch(console.error);