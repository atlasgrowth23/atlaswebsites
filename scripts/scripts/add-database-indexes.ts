import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function addDatabaseIndexes() {
  const client = await pool.connect();
  
  try {
    console.log('Adding database indexes for performance optimization...');
    
    // Add index on companies.slug for faster lookups
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_slug 
      ON companies(slug);
    `);
    console.log('✓ Added index on companies.slug');
    
    // Add index on companies.state for filtering
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_state 
      ON companies(state);
    `);
    console.log('✓ Added index on companies.state');
    
    // Add index on companies.city for filtering
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_city 
      ON companies(city);
    `);
    console.log('✓ Added index on companies.city');
    
    // Add composite index for common queries
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_state_city_name 
      ON companies(state, city, name);
    `);
    console.log('✓ Added composite index on companies(state, city, name)');
    
    // Add index on company_frames.company_id for joins
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_frames_company_id 
      ON company_frames(company_id);
    `);
    console.log('✓ Added index on company_frames.company_id');
    
    // Add index on enhanced_tracking.company_id for joins
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enhanced_tracking_company_id 
      ON enhanced_tracking(company_id);
    `);
    console.log('✓ Added index on enhanced_tracking.company_id');
    
    // Add index on enhanced_tracking.session_id for filtering
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enhanced_tracking_session_id 
      ON enhanced_tracking(session_id);
    `);
    console.log('✓ Added index on enhanced_tracking.session_id');
    
    // Add index on enhanced_tracking.last_viewed_at for time-based queries
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enhanced_tracking_last_viewed_at 
      ON enhanced_tracking(last_viewed_at);
    `);
    console.log('✓ Added index on enhanced_tracking.last_viewed_at');
    
    console.log('\n✅ All database indexes added successfully!');
    console.log('These indexes will significantly improve query performance for:');
    console.log('- Business dashboard pagination');
    console.log('- Company lookups by slug');
    console.log('- State and city filtering');
    console.log('- Tracking data joins');
    
  } catch (error) {
    console.error('Error adding database indexes:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  addDatabaseIndexes().catch(console.error);
}

export { addDatabaseIndexes };