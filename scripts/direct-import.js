const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create a PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function directImport() {
  console.log('Starting blazing-fast direct import...');
  
  try {
    // Connect to the database
    const client = await pool.connect();
    
    try {
      // 1. Read JSON data
      const jsonFilePath = path.join(__dirname, '../dataset_Google-Maps-Reviews-Scraper_2025-05-14_17-36-14-844.json');
      console.log(`Reading JSON file: ${jsonFilePath}`);
      const reviews = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
      console.log(`Found ${reviews.length} reviews in the file`);
      
      // 2. Get company data for mapping
      console.log('Getting company data...');
      const { rows: companies } = await client.query('SELECT id, place_id FROM companies WHERE place_id IS NOT NULL');
      const placeIdToCompanyId = {};
      companies.forEach(company => {
        placeIdToCompanyId[company.place_id] = company.id;
      });
      console.log(`Found ${companies.length} companies with place IDs`);
      
      // 3. Insert reviews directly in chunks
      console.log('Starting direct insert process...');
      await client.query('BEGIN');

      // Force creation of the company_reviews table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS company_reviews (
            id SERIAL PRIMARY KEY,
            company_id TEXT REFERENCES companies(id),
            place_id TEXT NOT NULL,
            review_id TEXT UNIQUE NOT NULL,
            reviewer_id TEXT,
            reviewer_name TEXT,
            reviewer_url TEXT,
            reviewer_photo_url TEXT,
            reviewer_reviews_count INTEGER,
            rating INTEGER,
            text TEXT,
            response_from_owner_text TEXT,
            response_from_owner_date TIMESTAMP,
            published_at_text TEXT,
            published_at TIMESTAMP,
            review_url TEXT,
            language TEXT,
            is_local_guide BOOLEAN,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Process in chunks of 100 for speed and to avoid timeouts
      const CHUNK_SIZE = 100;
      let insertedCount = 0;
      let skippedCount = 0;
      
      for (let i = 0; i < reviews.length; i += CHUNK_SIZE) {
        const chunk = reviews.slice(i, i + CHUNK_SIZE);
        const values = [];
        const placeholders = [];
        let paramIndex = 1;
        
        for (const review of chunk) {
          // Skip if no place_id or no matching company
          if (!review.placeId || !placeIdToCompanyId[review.placeId]) {
            skippedCount++;
            continue;
          }
          
          const companyId = placeIdToCompanyId[review.placeId];
          const reviewId = review.reviewId || `${companyId}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
          
          // Convert to the right data types
          const isLocalGuide = review.isLocalGuide === true || review.isLocalGuide === "true";
          const stars = parseInt(review.stars) || null;
          const publishedAtDate = review.publishedAtDate ? new Date(review.publishedAtDate) : null;
          const responseDate = review.responseFromOwnerDate ? new Date(review.responseFromOwnerDate) : null;
          const reviewerNumReviews = review.reviewerNumberOfReviews ? parseInt(review.reviewerNumberOfReviews) : null;
          
          // Add the values
          values.push(
            companyId,
            review.placeId,
            reviewId,
            review.reviewerId || null,
            review.name || null,
            review.reviewerUrl || null,
            review.reviewerPhotoUrl || null,
            reviewerNumReviews,
            stars,
            review.text || null,
            review.responseFromOwnerText || null,
            responseDate,
            review.publishAt || null,
            publishedAtDate,
            review.reviewUrl || null,
            review.language || null,
            isLocalGuide
          );
          
          // Create placeholders
          const placeholder = `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8}, $${paramIndex + 9}, $${paramIndex + 10}, $${paramIndex + 11}, $${paramIndex + 12}, $${paramIndex + 13}, $${paramIndex + 14}, $${paramIndex + 15}, $${paramIndex + 16})`;
          placeholders.push(placeholder);
          paramIndex += 17;
        }
        
        if (placeholders.length > 0) {
          // Execute the insert
          const insertQuery = `
            INSERT INTO company_reviews (
                company_id, place_id, review_id, reviewer_id, reviewer_name, 
                reviewer_url, reviewer_photo_url, reviewer_reviews_count, rating, text,
                response_from_owner_text, response_from_owner_date, published_at_text, 
                published_at, review_url, language, is_local_guide
            ) VALUES ${placeholders.join(', ')}
            ON CONFLICT (review_id) DO UPDATE 
            SET 
                reviewer_name = EXCLUDED.reviewer_name,
                rating = EXCLUDED.rating,
                text = EXCLUDED.text,
                response_from_owner_text = EXCLUDED.response_from_owner_text,
                response_from_owner_date = EXCLUDED.response_from_owner_date,
                published_at = EXCLUDED.published_at,
                review_url = EXCLUDED.review_url,
                updated_at = CURRENT_TIMESTAMP
          `;
          
          await client.query(insertQuery, values);
          insertedCount += placeholders.length;
          
          if (insertedCount % 1000 === 0 || insertedCount + skippedCount === reviews.length) {
            console.log(`Progress: ${insertedCount + skippedCount}/${reviews.length} (${insertedCount} inserted, ${skippedCount} skipped)`);
          }
        }
      }
      
      // Update the review counts in the companies table
      console.log('Updating review counts in companies table...');
      await client.query(`
        UPDATE companies c
        SET reviews = (
          SELECT COUNT(*) 
          FROM company_reviews cr 
          WHERE cr.company_id = c.id
        )
        WHERE EXISTS (
          SELECT 1 
          FROM company_reviews cr 
          WHERE cr.company_id = c.id
        )
      `);
      
      // Commit the transaction
      await client.query('COMMIT');
      
      // Get final count
      const { rows: [{ count }] } = await client.query('SELECT COUNT(*) FROM company_reviews');
      console.log(`Import completed successfully. Total reviews in database: ${count}`);
      
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error during import:', err);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the import
directImport().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});