const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const { format } = require('date-fns');

// Load environment variables
dotenv.config();

// Create a PostgreSQL pool with higher max connections
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20 // Increase connection pool size
});

async function fastImport() {
  console.log('Starting high-performance bulk import...');
  
  // Read the JSON file
  const jsonFilePath = path.join(__dirname, '../dataset_Google-Maps-Reviews-Scraper_2025-05-14_17-36-14-844.json');
  console.log(`Reading file: ${jsonFilePath}`);
  const fileContent = fs.readFileSync(jsonFilePath, 'utf8');
  const reviews = JSON.parse(fileContent);
  console.log(`Found ${reviews.length} reviews in the JSON file`);
  
  // Get mapping of place_ids to company_ids
  const client = await pool.connect();
  
  try {
    console.log('Fetching company data...');
    const companiesResult = await client.query('SELECT id, place_id FROM companies WHERE place_id IS NOT NULL');
    const companyPlaceIdMap = {};
    companiesResult.rows.forEach(company => {
      companyPlaceIdMap[company.place_id] = company.id;
    });
    console.log(`Found ${Object.keys(companyPlaceIdMap).length} companies with place_ids`);
    
    // Prepare for bulk import - create temporary table
    console.log('Creating temporary table for bulk import...');
    await client.query('BEGIN');
    
    await client.query(`
      CREATE TEMP TABLE temp_reviews (
        company_id TEXT,
        place_id TEXT,
        review_id TEXT,
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
        is_local_guide BOOLEAN
      ) ON COMMIT DROP
    `);
    
    // Process reviews in batches for memory efficiency
    const batchSize = 5000;
    const totalBatches = Math.ceil(reviews.length / batchSize);
    console.log(`Processing in ${totalBatches} batches of ${batchSize} reviews...`);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const start = batchIndex * batchSize;
      const end = Math.min(start + batchSize, reviews.length);
      const batchReviews = reviews.slice(start, end);
      
      console.log(`Processing batch ${batchIndex + 1}/${totalBatches}, reviews ${start} to ${end-1}...`);
      
      // Generate values for the batch
      const valueStrings = [];
      const values = [];
      let valueIndex = 1;
      
      for (const review of batchReviews) {
        // Skip if no placeId
        if (!review.placeId) continue;
        
        // Find the company_id for this place_id
        const companyId = companyPlaceIdMap[review.placeId];
        if (!companyId) continue;
        
        // Generate unique review ID if not provided
        const reviewId = review.reviewId || `${companyId}_${review.name || 'anon'}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        
        // Extract values
        const isLocalGuide = review.isLocalGuide === true || review.isLocalGuide === "true";
        const stars = parseInt(review.stars) || null;
        const publishedAtDate = review.publishedAtDate ? new Date(review.publishedAtDate) : null;
        const responseDate = review.responseFromOwnerDate ? new Date(review.responseFromOwnerDate) : null;
        const reviewerNumReviews = review.reviewerNumberOfReviews ? parseInt(review.reviewerNumberOfReviews) : null;
        
        // Build the parameter list for this review
        const params = [
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
        ];
        
        // Add the values to our arrays
        const valuePlaceholders = [];
        for (let i = 0; i < params.length; i++) {
          valuePlaceholders.push(`$${valueIndex}`);
          values.push(params[i]);
          valueIndex++;
        }
        
        valueStrings.push(`(${valuePlaceholders.join(', ')})`);
      }
      
      if (valueStrings.length > 0) {
        // Bulk insert into temp table
        const insertQuery = `
          INSERT INTO temp_reviews (
            company_id, place_id, review_id, reviewer_id, reviewer_name, 
            reviewer_url, reviewer_photo_url, reviewer_reviews_count, rating, text,
            response_from_owner_text, response_from_owner_date, published_at_text, 
            published_at, review_url, language, is_local_guide
          ) VALUES ${valueStrings.join(', ')}
        `;
        
        await client.query(insertQuery, values);
        console.log(`Batch ${batchIndex + 1}: Inserted ${valueStrings.length} reviews into temp table`);
      } else {
        console.log(`Batch ${batchIndex + 1}: No valid reviews to insert`);
      }
    }
    
    // Insert from temp table to the actual table
    console.log('Transferring data from temp table to company_reviews table...');
    const result = await client.query(`
      INSERT INTO company_reviews (
        company_id, place_id, review_id, reviewer_id, reviewer_name, 
        reviewer_url, reviewer_photo_url, reviewer_reviews_count, rating, text,
        response_from_owner_text, response_from_owner_date, published_at_text, 
        published_at, review_url, language, is_local_guide
      )
      SELECT 
        company_id, place_id, review_id, reviewer_id, reviewer_name, 
        reviewer_url, reviewer_photo_url, reviewer_reviews_count, rating, text,
        response_from_owner_text, response_from_owner_date, published_at_text, 
        published_at, review_url, language, is_local_guide
      FROM temp_reviews
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
    `);
    
    // Update companies table with review counts
    console.log('Updating company review counts...');
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
    
    console.log(`Import completed. Inserted/updated reviews.`);
    
    // Get final count
    const countResult = await client.query('SELECT COUNT(*) FROM company_reviews');
    console.log(`Total reviews in database: ${countResult.rows[0].count}`);
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during import:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

fastImport().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});