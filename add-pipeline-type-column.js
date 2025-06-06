const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function addPipelineTypeColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Adding pipeline_type column to lead_pipeline table...');
    
    // Add the pipeline_type column
    await client.query(`
      ALTER TABLE lead_pipeline 
      ADD COLUMN IF NOT EXISTS pipeline_type VARCHAR(50)
    `);
    
    console.log('✅ Added pipeline_type column');
    
    // Create an index for better performance
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lead_pipeline_type 
      ON lead_pipeline(pipeline_type)
    `);
    
    console.log('✅ Added index on pipeline_type');
    
    // Verify the column was added
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'lead_pipeline' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Updated lead_pipeline table structure:');
    columnsResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addPipelineTypeColumn().catch(console.error);