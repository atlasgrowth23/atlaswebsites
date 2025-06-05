const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkPipelineLeads() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking PIPELINE LEADS specifically...\n');
    
    // Get companies that are in the lead pipeline (your admin filtered ones)
    const pipelineLeadsQuery = await client.query(`
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
      ORDER BY c.state, c.name;
    `);
    
    console.log(`📊 Found ${pipelineLeadsQuery.rows.length} companies in your admin pipeline with place_ids`);
    
    // Breakdown by state
    const stateBreakdown = {};
    pipelineLeadsQuery.rows.forEach(row => {
      stateBreakdown[row.state] = (stateBreakdown[row.state] || 0) + 1;
    });
    
    console.log('\n🗺️ Pipeline leads by state:');
    Object.entries(stateBreakdown).forEach(([state, count]) => {
      console.log(`  ${state}: ${count} leads`);
    });
    
    // Check for missing place_ids in pipeline
    const missingPlaceIds = await client.query(`
      SELECT 
        c.name,
        c.state,
        c.place_id
      FROM companies c
      INNER JOIN lead_pipeline lp ON c.id = lp.company_id
      WHERE c.place_id IS NULL;
    `);
    
    if (missingPlaceIds.rows.length > 0) {
      console.log(`\n⚠️ ${missingPlaceIds.rows.length} pipeline companies missing place_ids:`);
      missingPlaceIds.rows.slice(0, 5).forEach((row, i) => {
        console.log(`  ${i + 1}. ${row.name} (${row.state})`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Show sample of companies ready for Outscraper
    console.log(`\n🎯 READY FOR OUTSCRAPER:`);
    console.log(`📝 Total place_ids to extract photos: ${pipelineLeadsQuery.rows.length}`);
    console.log(`\n📋 Sample pipeline companies (first 10):`);
    
    pipelineLeadsQuery.rows.slice(0, 10).forEach((row, i) => {
      console.log(`  ${i + 1}. ${row.name} (${row.city}, ${row.state})`);
      console.log(`     Place ID: ${row.place_id}`);
      console.log(`     Stage: ${row.stage}`);
    });
    
    if (pipelineLeadsQuery.rows.length > 10) {
      console.log(`  ... and ${pipelineLeadsQuery.rows.length - 10} more companies`);
    }
    
    // Export place_ids for Outscraper
    const placeIdsForOutscraper = pipelineLeadsQuery.rows.map(row => row.place_id);
    
    console.log('\n' + '='.repeat(60));
    console.log(`\n🚀 OUTSCRAPER API PREP:`);
    console.log(`📊 Total businesses: ${placeIdsForOutscraper.length}`);
    console.log(`💰 Estimated cost: ~$${(placeIdsForOutscraper.length * 0.05).toFixed(2)} (assuming $0.05 per business)`);
    console.log(`\n🆔 Place IDs ready for batch processing:`);
    console.log(`[${placeIdsForOutscraper.slice(0, 5).map(id => `"${id}"`).join(', ')}, ...]`);
    
    return {
      totalPipelineCompanies: pipelineLeadsQuery.rows.length,
      stateBreakdown,
      placeIdsForOutscraper,
      sampleCompanies: pipelineLeadsQuery.rows.slice(0, 5)
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkPipelineLeads().catch(console.error);