const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkLeadPipeline() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking lead_pipeline table...');
    
    // Check structure of lead_pipeline table
    const structureResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'lead_pipeline' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 lead_pipeline table structure:');
    structureResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });
    
    // Count total pipeline entries
    const totalResult = await client.query(`SELECT COUNT(*) as total FROM lead_pipeline`);
    console.log(`\n📊 Total pipeline entries: ${totalResult.rows[0].total}`);
    
    // Get all stages
    const stagesResult = await client.query(`
      SELECT stage, COUNT(*) as count 
      FROM lead_pipeline 
      WHERE stage IS NOT NULL
      GROUP BY stage 
      ORDER BY count DESC
    `);
    
    console.log('\n📋 Current stages in lead_pipeline:');
    stagesResult.rows.forEach(row => {
      console.log(`  "${row.stage}": ${row.count} entries`);
    });
    
    // Show recent pipeline entries
    const sampleResult = await client.query(`
      SELECT lp.stage, lp.notes, c.name as company_name, lp.updated_at
      FROM lead_pipeline lp
      JOIN companies c ON lp.company_id = c.id
      ORDER BY lp.updated_at DESC
      LIMIT 10
    `);
    
    console.log('\n📋 Recent pipeline entries:');
    sampleResult.rows.forEach(entry => {
      const updatedDate = entry.updated_at.toISOString().split('T')[0];
      console.log(`  ${entry.company_name}: "${entry.stage}" - Updated: ${updatedDate}`);
    });
    
    // Check how many companies are eligible for pipeline (Alabama/Arkansas, no website)
    const eligibleResult = await client.query(`
      SELECT COUNT(*) as eligible_companies
      FROM companies 
      WHERE state IN ('Alabama', 'Arkansas') 
        AND (site IS NULL OR site = '')
    `);
    
    console.log(`\n📊 Eligible companies for pipeline: ${eligibleResult.rows[0].eligible_companies}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkLeadPipeline().catch(console.error);