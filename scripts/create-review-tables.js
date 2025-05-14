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
    console.log('Creating review tables...');
    
    // First, ensure companies table has a primary key
    try {
      console.log('Checking companies table primary key...');
      await pool.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE table_name = 'companies'
            AND constraint_type = 'PRIMARY KEY'
          ) THEN
            ALTER TABLE companies ADD PRIMARY KEY (id);
            RAISE NOTICE 'Added primary key to companies table';
          ELSE
            RAISE NOTICE 'Primary key already exists on companies table';
          END IF;
        END
        $$;
      `);
      console.log('Ensured companies table has primary key');
    } catch (err) {
      console.error('Error ensuring companies primary key:', err);
      throw err;
    }
    
    // Create company_reviews table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS company_reviews (
        id SERIAL PRIMARY KEY,
        review_id TEXT UNIQUE,
        company_id TEXT REFERENCES companies(id),
        place_id TEXT,
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
        company_id TEXT PRIMARY KEY REFERENCES companies(id),
        total_reviews INTEGER DEFAULT 0,
        average_rating DECIMAL(3,2) DEFAULT 0,
        reviews_5_star INTEGER DEFAULT 0,
        reviews_4_star INTEGER DEFAULT 0,
        reviews_3_star INTEGER DEFAULT 0,
        reviews_2_star INTEGER DEFAULT 0,
        reviews_1_star INTEGER DEFAULT 0,
        latest_review_date TIMESTAMP WITH TIME ZONE,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('Created company_review_stats table');
    
    // Create function to update review stats automatically
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_company_review_stats() RETURNS TRIGGER AS $$
      BEGIN
        -- Either insert a new record or update existing one
        INSERT INTO company_review_stats (
          company_id, 
          total_reviews,
          average_rating,
          reviews_5_star,
          reviews_4_star,
          reviews_3_star,
          reviews_2_star,
          reviews_1_star,
          latest_review_date,
          updated_at
        )
        SELECT 
          company_id,
          COUNT(*),
          ROUND(AVG(rating)::numeric, 2),
          COUNT(*) FILTER (WHERE rating = 5),
          COUNT(*) FILTER (WHERE rating = 4),
          COUNT(*) FILTER (WHERE rating = 3),
          COUNT(*) FILTER (WHERE rating = 2),
          COUNT(*) FILTER (WHERE rating = 1),
          MAX(published_at),
          NOW()
        FROM company_reviews
        WHERE company_id = COALESCE(NEW.company_id, OLD.company_id)
        GROUP BY company_id
        ON CONFLICT (company_id) 
        DO UPDATE SET
          total_reviews = EXCLUDED.total_reviews,
          average_rating = EXCLUDED.average_rating,
          reviews_5_star = EXCLUDED.reviews_5_star,
          reviews_4_star = EXCLUDED.reviews_4_star,
          reviews_3_star = EXCLUDED.reviews_3_star,
          reviews_2_star = EXCLUDED.reviews_2_star,
          reviews_1_star = EXCLUDED.reviews_1_star,
          latest_review_date = EXCLUDED.latest_review_date,
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
    
    // Create index to optimize state filtering with review stats
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_companies_state_with_reviews ON companies(state) 
      WHERE EXISTS (
        SELECT 1 FROM company_review_stats rs 
        WHERE rs.company_id = companies.id AND rs.total_reviews > 0
      );
    `);
    console.log('Created index for state filtering with reviews');
    
    console.log('All review tables and triggers created successfully');
    
  } catch (err) {
    console.error('Error creating review tables:', err);
  } finally {
    await pool.end();
  }
}

// Run the script
createReviewTables().catch(console.error);