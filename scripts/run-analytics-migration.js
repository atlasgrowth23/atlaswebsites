// Enhanced analytics tracking migration
const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function runAnalyticsMigration() {
  if (!process.env.DIRECT_URL) {
    throw new Error('DIRECT_URL missing in env.local');
  }
  
  const client = await pool.connect();
  
  try {
    console.log('🚀 Adding enhanced analytics tracking columns...');
    
    // Add new columns for professional visitor tracking
    await client.query(`
      ALTER TABLE template_views 
      ADD COLUMN IF NOT EXISTS visitor_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS device_model VARCHAR(255),
      ADD COLUMN IF NOT EXISTS screen_resolution VARCHAR(50),
      ADD COLUMN IF NOT EXISTS timezone VARCHAR(100),
      ADD COLUMN IF NOT EXISTS language VARCHAR(10),
      ADD COLUMN IF NOT EXISTS platform VARCHAR(100),
      ADD COLUMN IF NOT EXISTS touch_support BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS page_title VARCHAR(500),
      ADD COLUMN IF NOT EXISTS is_return_visitor BOOLEAN DEFAULT FALSE;
    `);
    console.log('✅ Added enhanced tracking columns');
    
    // Create performance indexes
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_template_views_visitor_id 
      ON template_views(visitor_id);
    `);
    console.log('✅ Created visitor_id index');
    
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_template_views_device_model 
      ON template_views(device_model);
    `);
    console.log('✅ Created device_model index');
    
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_template_views_is_return_visitor 
      ON template_views(is_return_visitor);
    `);
    console.log('✅ Created return_visitor index');
    
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_template_views_fingerprint 
      ON template_views(company_id, screen_resolution, timezone, platform);
    `);
    console.log('✅ Created fingerprint composite index');
    
    console.log('🎉 Enhanced analytics migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runAnalyticsMigration().catch(error => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});