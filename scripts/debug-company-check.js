const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function debugCompanyCheck() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Debug: Checking company data...\n');
    
    // First, check total companies
    const totalResult = await client.query(`
      SELECT state, COUNT(*) as count
      FROM companies 
      WHERE state IN ('Alabama', 'Arkansas')
      GROUP BY state;
    `);
    
    console.log('📊 Total companies by state:');
    totalResult.rows.forEach(row => {
      console.log(`  ${row.state}: ${row.count} companies`);
    });
    
    // Check place_id availability
    const placeIdResult = await client.query(`
      SELECT 
        state, 
        COUNT(*) as total,
        COUNT(place_id) as with_place_id,
        COUNT(*) - COUNT(place_id) as missing_place_id
      FROM companies 
      WHERE state IN ('Alabama', 'Arkansas')
      GROUP BY state;
    `);
    
    console.log('\n🆔 Place ID availability:');
    placeIdResult.rows.forEach(row => {
      console.log(`  ${row.state}: ${row.with_place_id}/${row.total} have place_ids (${row.missing_place_id} missing)`);
    });
    
    // Check company_frames table
    const framesResult = await client.query(`
      SELECT COUNT(*) as total_frames
      FROM company_frames;
    `);
    
    console.log(`\n🖼️ Total frames in company_frames: ${framesResult.rows[0].total_frames}`);
    
    // Check the actual LEFT JOIN query step by step
    const detailedResult = await client.query(`
      SELECT 
        c.state,
        COUNT(*) as total_companies,
        COUNT(cf.company_id) as companies_with_frames,
        COUNT(*) - COUNT(cf.company_id) as companies_without_frames
      FROM companies c
      LEFT JOIN company_frames cf ON c.id = cf.company_id
      WHERE c.state IN ('Alabama', 'Arkansas')
        AND c.place_id IS NOT NULL
      GROUP BY c.state;
    `);
    
    console.log('\n📊 Detailed analysis:');
    detailedResult.rows.forEach(row => {
      console.log(`  ${row.state}:`);
      console.log(`    Total companies with place_id: ${row.total_companies}`);
      console.log(`    Companies with frames: ${row.companies_with_frames}`);
      console.log(`    Companies WITHOUT frames: ${row.companies_without_frames}`);
    });
    
    // Get some examples of companies without frames
    const examplesResult = await client.query(`
      SELECT 
        c.name,
        c.state,
        c.place_id,
        cf.company_id as has_frame
      FROM companies c
      LEFT JOIN company_frames cf ON c.id = cf.company_id
      WHERE c.state IN ('Alabama', 'Arkansas')
        AND c.place_id IS NOT NULL
        AND cf.company_id IS NULL
      LIMIT 10;
    `);
    
    console.log('\n📋 Sample companies WITHOUT frames:');
    examplesResult.rows.forEach((row, i) => {
      console.log(`  ${i + 1}. ${row.name} (${row.state}) - ${row.place_id}`);
    });
    
    console.log(`\n✅ Found ${examplesResult.rows.length} companies that need photos extracted`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

debugCompanyCheck().catch(console.error);