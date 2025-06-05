const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkAllPipelineStages() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking ALL pipeline stages...\n');
    
    // Get ALL companies in lead_pipeline, including "new_lead" stage
    const allPipelineQuery = await client.query(`
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
      ORDER BY c.state, lp.stage, c.name;
    `);
    
    console.log(`📊 Found ${allPipelineQuery.rows.length} total companies in pipeline`);
    
    // Breakdown by state and stage
    const breakdown = {};
    allPipelineQuery.rows.forEach(row => {
      if (!breakdown[row.state]) breakdown[row.state] = {};
      breakdown[row.state][row.stage] = (breakdown[row.state][row.stage] || 0) + 1;
    });
    
    console.log('\n📈 Complete pipeline breakdown:');
    Object.entries(breakdown).forEach(([state, stages]) => {
      console.log(`\n  ${state}:`);
      Object.entries(stages).forEach(([stage, count]) => {
        console.log(`    ${stage}: ${count} companies`);
      });
      const stateTotal = Object.values(stages).reduce((sum, count) => sum + count, 0);
      console.log(`    TOTAL: ${stateTotal} companies`);
    });
    
    // Check for missing place_ids
    const withPlaceIds = allPipelineQuery.rows.filter(row => row.place_id);
    const withoutPlaceIds = allPipelineQuery.rows.filter(row => !row.place_id);
    
    console.log('\n🆔 Place ID status:');
    console.log(`  Companies with place_ids: ${withPlaceIds.length}`);
    console.log(`  Companies WITHOUT place_ids: ${withoutPlaceIds.length}`);
    
    if (withoutPlaceIds.length > 0) {
      console.log('\n⚠️ Companies missing place_ids:');
      withoutPlaceIds.slice(0, 5).forEach((row, i) => {
        console.log(`  ${i + 1}. ${row.name} (${row.state}) - Stage: ${row.stage}`);
      });
      if (withoutPlaceIds.length > 5) {
        console.log(`  ... and ${withoutPlaceIds.length - 5} more`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Prepare for Outscraper - only companies with place_ids
    const readyForOutscraper = withPlaceIds;
    const placeIdsForOutscraper = readyForOutscraper.map(row => row.place_id);
    
    console.log(`\n🎯 READY FOR OUTSCRAPER:`);
    console.log(`📊 Total pipeline companies with place_ids: ${readyForOutscraper.length}`);
    
    const readyBreakdown = {};
    readyForOutscraper.forEach(row => {
      readyBreakdown[row.state] = (readyBreakdown[row.state] || 0) + 1;
    });
    
    console.log('\n🗺️ Ready for photo extraction by state:');
    Object.entries(readyBreakdown).forEach(([state, count]) => {
      console.log(`  ${state}: ${count} companies`);
    });
    
    console.log(`\n💰 Estimated Outscraper cost: ~$${(readyForOutscraper.length * 0.05).toFixed(2)}`);
    
    console.log(`\n📋 Sample companies for photo extraction (first 10):`);
    readyForOutscraper.slice(0, 10).forEach((row, i) => {
      console.log(`  ${i + 1}. ${row.name} (${row.city}, ${row.state}) - ${row.stage}`);
      console.log(`     Place ID: ${row.place_id}`);
    });
    
    if (readyForOutscraper.length > 10) {
      console.log(`  ... and ${readyForOutscraper.length - 10} more companies`);
    }
    
    console.log('\n🚀 Place IDs for Outscraper API:');
    console.log(`[${placeIdsForOutscraper.slice(0, 3).map(id => `"${id}"`).join(', ')}, ...]`);
    
    return {
      totalPipelineCompanies: allPipelineQuery.rows.length,
      readyForOutscraper: readyForOutscraper.length,
      breakdown,
      placeIdsForOutscraper
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkAllPipelineStages().catch(console.error);