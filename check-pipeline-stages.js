const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkPipelineStages() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking all pipeline stages...');
    
    // Count total leads
    const totalResult = await client.query(`SELECT COUNT(*) as total FROM leads`);
    console.log(`\n📊 Total leads: ${totalResult.rows[0].total}`);
    
    // Get all unique stages currently in use
    const stagesResult = await client.query(`
      SELECT stage, COUNT(*) as count 
      FROM leads 
      WHERE stage IS NOT NULL
      GROUP BY stage 
      ORDER BY count DESC
    `);
    
    console.log('\n📋 Current stages in database:');
    stagesResult.rows.forEach(row => {
      console.log(`  "${row.stage}": ${row.count} leads`);
    });
    
    // Check for NULL stages
    const nullStagesResult = await client.query(`
      SELECT COUNT(*) as null_count 
      FROM leads 
      WHERE stage IS NULL
    `);
    
    if (nullStagesResult.rows[0].null_count > 0) {
      console.log(`\n⚠️  ${nullStagesResult.rows[0].null_count} leads have NULL stage`);
    }
    
    // Show sample leads with their stages
    const sampleResult = await client.query(`
      SELECT l.id, l.stage, l.notes, c.name as company_name, l.created_at
      FROM leads l
      JOIN companies c ON l.company_id = c.id
      ORDER BY l.created_at DESC
      LIMIT 10
    `);
    
    console.log('\n📋 Recent leads:');
    sampleResult.rows.forEach(lead => {
      console.log(`  ${lead.company_name}: "${lead.stage}" - Created: ${lead.created_at.toISOString().split('T')[0]}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkPipelineStages().catch(console.error);