const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkPipelineCompanies() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking pipeline companies...\n');
    
    // Get all companies in pipeline with their Google place_ids
    const pipelineQuery = await client.query(`
      SELECT 
        c.id,
        c.name,
        c.slug,
        c.place_id,
        c.city,
        c.state,
        lp.stage,
        lp.created_at as added_to_pipeline
      FROM companies c
      INNER JOIN lead_pipeline lp ON c.id = lp.company_id
      WHERE c.place_id IS NOT NULL
      ORDER BY lp.created_at DESC;
    `);
    
    console.log(`📊 Found ${pipelineQuery.rows.length} companies in pipeline with place_ids\n`);
    
    // Group by stage
    const stageBreakdown = {};
    pipelineQuery.rows.forEach(row => {
      stageBreakdown[row.stage] = (stageBreakdown[row.stage] || 0) + 1;
    });
    
    console.log('📈 Pipeline stage breakdown:');
    Object.entries(stageBreakdown).forEach(([stage, count]) => {
      console.log(`  ${stage}: ${count} companies`);
    });
    
    console.log('\n' + '='.repeat(60));
    
    // Check which already have photos extracted
    const photosQuery = await client.query(`
      SELECT 
        c.id,
        c.name,
        COUNT(cf.id) as current_images
      FROM companies c
      INNER JOIN lead_pipeline lp ON c.id = lp.company_id
      LEFT JOIN company_frames cf ON c.id = cf.company_id
      WHERE c.place_id IS NOT NULL
      GROUP BY c.id, c.name
      ORDER BY current_images DESC, c.name;
    `);
    
    const withImages = photosQuery.rows.filter(row => row.current_images > 0);
    const withoutImages = photosQuery.rows.filter(row => row.current_images === 0);
    
    console.log(`\n🖼️ Image status:`);
    console.log(`  Companies with images: ${withImages.length}`);
    console.log(`  Companies without images: ${withoutImages.length}`);
    
    console.log(`\n📋 Sample companies that need photos:`);
    withoutImages.slice(0, 10).forEach((row, i) => {
      const company = pipelineQuery.rows.find(p => p.id === row.id);
      console.log(`  ${i + 1}. ${row.name} (${company?.city}, ${company?.state}) - Stage: ${company?.stage}`);
    });
    
    if (withoutImages.length > 10) {
      console.log(`  ... and ${withoutImages.length - 10} more companies`);
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Show sample place_ids for Outscraper
    console.log('\n🆔 Sample place_ids for Outscraper:');
    withoutImages.slice(0, 5).forEach((row, i) => {
      const company = pipelineQuery.rows.find(p => p.id === row.id);
      console.log(`  ${i + 1}. ${company?.place_id} (${row.name})`);
    });
    
    console.log(`\n✅ Ready to extract photos for ${withoutImages.length} companies`);
    console.log(`📝 Outscraper API will need to process ${withoutImages.length} place_ids`);
    
    return {
      total: pipelineQuery.rows.length,
      withImages: withImages.length,
      needingPhotos: withoutImages.length,
      stageBreakdown,
      companiesNeedingPhotos: withoutImages.map(row => {
        const company = pipelineQuery.rows.find(p => p.id === row.id);
        return {
          id: row.id,
          name: row.name,
          place_id: company?.place_id,
          stage: company?.stage
        };
      })
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkPipelineCompanies().catch(console.error);