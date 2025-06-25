const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

// Use the exact same approach that worked before  
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

console.log('Using DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'Not found');

async function addDatabaseIndexes() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Adding database indexes for performance optimization...');
    
    // Template views indexes (the ones we need)
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_template_views_company_id 
      ON template_views(company_id);
    `);
    console.log('✓ Added index on template_views.company_id');
    
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_template_views_session_id 
      ON template_views(session_id);
    `);
    console.log('✓ Added index on template_views.session_id');
    
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_template_views_created_at 
      ON template_views(created_at DESC);
    `);
    console.log('✓ Added index on template_views.created_at');
    
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_template_views_company_date 
      ON template_views(company_id, created_at DESC);
    `);
    console.log('✓ Added composite index on template_views(company_id, created_at)');
    
    // Companies indexes
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_slug 
      ON companies(slug);
    `);
    console.log('✓ Added index on companies.slug');
    
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_state 
      ON companies(state);
    `);
    console.log('✓ Added index on companies.state');
    
    // Company frames indexes  
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_frames_company_id 
      ON company_frames(company_id);
    `);
    console.log('✓ Added index on company_frames.company_id');
    
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_frames_lookup 
      ON company_frames(company_id, slug);
    `);
    console.log('✓ Added composite index on company_frames(company_id, slug)');
    
    console.log('\n🎉 All analytics indexes added successfully!');
    console.log('Query performance should be significantly improved.');
    
  } catch (error) {
    console.error('❌ Error adding database indexes:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addDatabaseIndexes().catch(console.error);