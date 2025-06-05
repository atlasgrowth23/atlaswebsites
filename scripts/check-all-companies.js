const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkAllCompanies() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking ALL companies in Alabama and Arkansas...\n');
    
    // Get all companies in AL and AR with place_ids
    const allCompaniesQuery = await client.query(`
      SELECT 
        c.id,
        c.name,
        c.slug,
        c.place_id,
        c.city,
        c.state,
        c.created_at
      FROM companies c
      WHERE c.state IN ('Alabama', 'Arkansas')
        AND c.place_id IS NOT NULL
      ORDER BY c.state, c.name;
    `);
    
    console.log(`📊 Found ${allCompaniesQuery.rows.length} total companies with place_ids`);
    
    // Breakdown by state
    const stateBreakdown = {};
    allCompaniesQuery.rows.forEach(row => {
      stateBreakdown[row.state] = (stateBreakdown[row.state] || 0) + 1;
    });
    
    console.log('\n🗺️ State breakdown:');
    Object.entries(stateBreakdown).forEach(([state, count]) => {
      console.log(`  ${state}: ${count} companies`);
    });
    
    console.log('\n' + '='.repeat(60));
    
    // Check which already have photos in company_frames
    const photosQuery = await client.query(`
      SELECT 
        c.id,
        c.name,
        c.state,
        c.place_id,
        COUNT(cf.id) as current_images,
        STRING_AGG(cf.slug, ', ') as frame_types
      FROM companies c
      LEFT JOIN company_frames cf ON c.id = cf.company_id
      WHERE c.state IN ('Alabama', 'Arkansas')
        AND c.place_id IS NOT NULL
      GROUP BY c.id, c.name, c.state, c.place_id
      ORDER BY current_images ASC, c.state, c.name;
    `);
    
    const withImages = photosQuery.rows.filter(row => row.current_images > 0);
    const withoutImages = photosQuery.rows.filter(row => row.current_images === 0);
    
    console.log(`\n🖼️ Image status:`);
    console.log(`  Companies with images: ${withImages.length}`);
    console.log(`  Companies WITHOUT images: ${withoutImages.length}`);
    
    // Show breakdown by state for companies needing photos
    const needingPhotosByState = {};
    withoutImages.forEach(row => {
      needingPhotosByState[row.state] = (needingPhotosByState[row.state] || 0) + 1;
    });
    
    console.log(`\n🚫 Companies needing photos by state:`);
    Object.entries(needingPhotosByState).forEach(([state, count]) => {
      console.log(`  ${state}: ${count} companies need photos`);
    });
    
    console.log(`\n📋 Sample companies that need photos (first 15):`);
    withoutImages.slice(0, 15).forEach((row, i) => {
      console.log(`  ${i + 1}. ${row.name} (${row.state}) - Place ID: ${row.place_id}`);
    });
    
    if (withoutImages.length > 15) {
      console.log(`  ... and ${withoutImages.length - 15} more companies`);
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Show companies that already have some images
    console.log(`\n✅ Companies that already have images (first 10):`);
    withImages.slice(0, 10).forEach((row, i) => {
      console.log(`  ${i + 1}. ${row.name} (${row.state}) - ${row.current_images} images: ${row.frame_types}`);
    });
    
    console.log('\n' + '='.repeat(60));
    
    // Prepare data for Outscraper
    const placeIdsForOutscraper = withoutImages.map(row => row.place_id);
    
    console.log(`\n🎯 OUTSCRAPER READY:`);
    console.log(`📝 Total place_ids to process: ${placeIdsForOutscraper.length}`);
    console.log(`🆔 Sample place_ids for API:`);
    placeIdsForOutscraper.slice(0, 5).forEach((placeId, i) => {
      console.log(`  ${i + 1}. ${placeId}`);
    });
    
    console.log(`\n💰 Estimated Outscraper cost:`);
    console.log(`  ${placeIdsForOutscraper.length} businesses × ~$0.05 = ~$${(placeIdsForOutscraper.length * 0.05).toFixed(2)}`);
    
    return {
      total: allCompaniesQuery.rows.length,
      withImages: withImages.length,
      needingPhotos: withoutImages.length,
      stateBreakdown,
      needingPhotosByState,
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

checkAllCompanies().catch(console.error);