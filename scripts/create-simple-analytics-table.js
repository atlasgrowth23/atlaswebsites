const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createSimpleAnalyticsTable() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Creating simple analytics table...');
    
    // Create simple page_views table
    await client.query(`
      CREATE TABLE IF NOT EXISTS page_views (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        page_url TEXT DEFAULT '/',
        referrer TEXT DEFAULT '',
        device_type TEXT DEFAULT 'desktop',
        user_agent TEXT DEFAULT '',
        viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✓ Created page_views table');
    
    // Add indexes for performance
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_page_views_company_id 
      ON page_views(company_id);
    `);
    console.log('✓ Added index on company_id');
    
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_page_views_viewed_at 
      ON page_views(viewed_at DESC);
    `);
    console.log('✓ Added index on viewed_at');
    
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_page_views_company_date 
      ON page_views(company_id, viewed_at DESC);
    `);
    console.log('✓ Added composite index on company_id and viewed_at');
    
    console.log('✅ Simple analytics table created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating analytics table:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  createSimpleAnalyticsTable();
}

module.exports = { createSimpleAnalyticsTable };