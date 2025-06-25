const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function addAllCompaniesToPipeline() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Adding all AL/AR companies to pipeline...\n');
    
    // First, check how many companies we have
    const countResult = await client.query(`
      SELECT 
        state,
        COUNT(*) as total,
        COUNT(place_id) as with_place_id
      FROM companies 
      WHERE state IN ('Alabama', 'Arkansas')
      GROUP BY state;
    `);
    
    console.log('📊 Companies to add to pipeline:');
    countResult.rows.forEach(row => {
      console.log(`  ${row.state}: ${row.with_place_id}/${row.total} companies with place_ids`);
    });
    
    // Add all companies with place_ids to pipeline as "voicemail_left"
    const insertResult = await client.query(`
      INSERT INTO lead_pipeline (company_id, stage, notes, created_at, updated_at)
      SELECT 
        c.id,
        'voicemail_left' as stage,
        'Auto-added for photo extraction' as notes,
        NOW() as created_at,
        NOW() as updated_at
      FROM companies c
      WHERE c.state IN ('Alabama', 'Arkansas')
        AND c.place_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM lead_pipeline lp 
          WHERE lp.company_id = c.id
        )
      ON CONFLICT (company_id) DO NOTHING;
    `);
    
    console.log(`\n✅ Added ${insertResult.rowCount} companies to pipeline`);
    
    // Verify the results
    const verifyResult = await client.query(`
      SELECT 
        c.state,
        lp.stage,
        COUNT(*) as count
      FROM companies c
      INNER JOIN lead_pipeline lp ON c.id = lp.company_id
      WHERE c.state IN ('Alabama', 'Arkansas')
        AND c.place_id IS NOT NULL
      GROUP BY c.state, lp.stage
      ORDER BY c.state, lp.stage;
    `);
    
    console.log('\n📈 Pipeline breakdown after adding companies:');
    verifyResult.rows.forEach(row => {
      console.log(`  ${row.state} - ${row.stage}: ${row.count} companies`);
    });
    
    // Get total counts
    const totalResult = await client.query(`
      SELECT 
        c.state,
        COUNT(*) as total_in_pipeline
      FROM companies c
      INNER JOIN lead_pipeline lp ON c.id = lp.company_id
      WHERE c.state IN ('Alabama', 'Arkansas')
        AND c.place_id IS NOT NULL
      GROUP BY c.state;
    `);
    
    console.log('\n🎯 Total pipeline companies with place_ids:');
    let grandTotal = 0;
    totalResult.rows.forEach(row => {
      console.log(`  ${row.state}: ${row.total_in_pipeline} companies`);
      grandTotal += parseInt(row.total_in_pipeline);
    });
    console.log(`  GRAND TOTAL: ${grandTotal} companies ready for Outscraper`);
    
    console.log('\n🚀 Ready to extract photos for all pipeline companies!');
    
    return {
      companiesAdded: insertResult.rowCount,
      totalReady: grandTotal,
      breakdown: totalResult.rows
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addAllCompaniesToPipeline().catch(console.error);