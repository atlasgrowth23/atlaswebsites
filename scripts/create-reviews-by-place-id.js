const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Create PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Create tables for Google Reviews
 */
async function createReviewTables() {
  try {
    console.log('Creating review tables using place_id as the relationship key...');
    
    // First, add an index on place_id
    try {
      console.log('Adding index on place_id...');
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_companies_place_id ON companies(place_id);
      `);
      console.log('Created index on companies.place_id');
    } catch (err) {
      console.error('Error creating place_id index:', err);
      // Continue with the script even if this fails
    }
    
    // Create company_reviews table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS company_reviews (
        id SERIAL PRIMARY KEY,
        review_id TEXT UNIQUE,
        company_id TEXT,
        place_id TEXT NOT NULL,
        reviewer_name TEXT,
        review_text TEXT,
        rating INTEGER,
        published_at TIMESTAMP WITH TIME ZONE,
        reviewer_photo_url TEXT,
        response_from_owner_text TEXT,
        response_from_owner_date TIMESTAMP WITH TIME ZONE,
        review_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('Created company_reviews table');
    
    // Create indexes on company_reviews
    await pool.query('CREATE INDEX IF NOT EXISTS idx_reviews_company_id ON company_reviews(company_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_reviews_place_id ON company_reviews(place_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_reviews_published_at ON company_reviews(published_at);');
    console.log('Created indexes on company_reviews table');
    
    // Create company_review_stats table for aggregated metrics
    await pool.query(`
      CREATE TABLE IF NOT EXISTS company_review_stats (
        place_id TEXT PRIMARY KEY,
        company_id TEXT,
        company_name TEXT,
        total_reviews INTEGER DEFAULT 0,
        average_rating DECIMAL(3,2) DEFAULT 0,
        reviews_5_star INTEGER DEFAULT 0,
        reviews_4_star INTEGER DEFAULT 0,
        reviews_3_star INTEGER DEFAULT 0,
        reviews_2_star INTEGER DEFAULT 0,
        reviews_1_star INTEGER DEFAULT 0,
        latest_review_date TIMESTAMP WITH TIME ZONE,
        state TEXT,
        city TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('Created company_review_stats table');
    
    // Create function to update review stats automatically
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_company_review_stats() RETURNS TRIGGER AS $$
      DECLARE
        company_info RECORD;
      BEGIN
        -- Get company info
        SELECT id, name, state, city INTO company_info
        FROM companies 
        WHERE place_id = COALESCE(NEW.place_id, OLD.place_id)
        LIMIT 1;
      
        -- Either insert a new record or update existing one
        INSERT INTO company_review_stats (
          place_id,
          company_id,
          company_name,
          total_reviews,
          average_rating,
          reviews_5_star,
          reviews_4_star,
          reviews_3_star,
          reviews_2_star,
          reviews_1_star,
          latest_review_date,
          state,
          city,
          updated_at
        )
        SELECT 
          r.place_id,
          company_info.id,
          company_info.name,
          COUNT(*),
          ROUND(AVG(rating)::numeric, 2),
          COUNT(*) FILTER (WHERE rating = 5),
          COUNT(*) FILTER (WHERE rating = 4),
          COUNT(*) FILTER (WHERE rating = 3),
          COUNT(*) FILTER (WHERE rating = 2),
          COUNT(*) FILTER (WHERE rating = 1),
          MAX(published_at),
          company_info.state,
          company_info.city,
          NOW()
        FROM company_reviews r
        WHERE r.place_id = COALESCE(NEW.place_id, OLD.place_id)
        GROUP BY r.place_id
        ON CONFLICT (place_id) 
        DO UPDATE SET
          company_id = EXCLUDED.company_id,
          company_name = EXCLUDED.company_name,
          total_reviews = EXCLUDED.total_reviews,
          average_rating = EXCLUDED.average_rating,
          reviews_5_star = EXCLUDED.reviews_5_star,
          reviews_4_star = EXCLUDED.reviews_4_star,
          reviews_3_star = EXCLUDED.reviews_3_star,
          reviews_2_star = EXCLUDED.reviews_2_star,
          reviews_1_star = EXCLUDED.reviews_1_star,
          latest_review_date = EXCLUDED.latest_review_date,
          state = EXCLUDED.state,
          city = EXCLUDED.city,
          updated_at = NOW();
          
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('Created update_company_review_stats function');
    
    // Create triggers to update stats automatically when reviews change
    await pool.query(`
      DROP TRIGGER IF EXISTS trigger_update_company_review_stats ON company_reviews;
      
      CREATE TRIGGER trigger_update_company_review_stats
      AFTER INSERT OR UPDATE OR DELETE ON company_reviews
      FOR EACH ROW EXECUTE FUNCTION update_company_review_stats();
    `);
    console.log('Created trigger for automatic stats updates');
    
    // Create indexes for efficient filtering
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_review_stats_state ON company_review_stats(state);
      CREATE INDEX IF NOT EXISTS idx_review_stats_city ON company_review_stats(city);
      CREATE INDEX IF NOT EXISTS idx_review_stats_company_id ON company_review_stats(company_id);
    `);
    console.log('Created indexes for efficient filtering');
    
    console.log('All review tables and triggers created successfully');
    
  } catch (err) {
    console.error('Error creating review tables:', err);
  } finally {
    await pool.end();
  }
}

// Run the script
createReviewTables().catch(console.error);