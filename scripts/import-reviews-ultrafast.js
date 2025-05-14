const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { format } = require('date-fns');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create a PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

/**
 * Ultra-fast review import using direct COPY
 */
async function ultraFastImport() {
  console.log('Starting ultra-fast direct import...');
  const client = await pool.connect();
  
  try {
    // Phase 1: Read the JSON file
    const jsonFilePath = path.join(__dirname, '../dataset_Google-Maps-Reviews-Scraper_2025-05-14_17-36-14-844.json');
    console.log(`Reading JSON file: ${jsonFilePath}`);
    const reviews = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    console.log(`Found ${reviews.length} reviews in JSON file`);
    
    // Phase 2: Get company place_id mapping
    console.log('Fetching company data...');
    const companiesResult = await client.query('SELECT id, place_id FROM companies WHERE place_id IS NOT NULL');
    const companyPlaceIdMap = {};
    companiesResult.rows.forEach(company => {
      companyPlaceIdMap[company.place_id] = company.id;
    });
    console.log(`Found ${Object.keys(companyPlaceIdMap).length} companies with place_ids`);
    
    // Phase 3: Create a staging table that we'll load the data into
    console.log('Setting up staging table...');
    await client.query('BEGIN');
    await client.query(`DROP TABLE IF EXISTS review_staging`);
    await client.query(`
      CREATE TABLE review_staging (
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
      )
    `);
    
    // Phase 4: Generate SQL INSERT statements with 500 reviews per statement
    console.log('Generating SQL statements...');
    const batchSize = 500;
    const sqlFilePath = path.join(__dirname, '../reviews_import.sql');
    let fileStream = fs.createWriteStream(sqlFilePath);
    
    fileStream.write('BEGIN;\n');
    
    let validReviewCount = 0;
    let batchCount = 0;
    let valueStrings = [];
    
    for (const review of reviews) {
      if (!review.placeId) continue;
      
      const companyId = companyPlaceIdMap[review.placeId];
      if (!companyId) continue;
      
      const reviewId = review.reviewId || `${companyId}_${review.name || 'anon'}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const isLocalGuide = review.isLocalGuide === true || review.isLocalGuide === "true";
      const stars = parseInt(review.stars) || null;
      const publishedAtDate = review.publishedAtDate ? `'${review.publishedAtDate}'` : 'NULL';
      const responseDate = review.responseFromOwnerDate ? `'${review.responseFromOwnerDate}'` : 'NULL';
      const reviewerNumReviews = review.reviewerNumberOfReviews ? parseInt(review.reviewerNumberOfReviews) : 'NULL';
      
      // Escape special characters
      const escapeStr = (str) => {
        if (str === null || str === undefined) return 'NULL';
        return `'${str.replace(/'/g, "''")}'`;
      };
      
      const values = [
        escapeStr(companyId),
        escapeStr(review.placeId),
        escapeStr(reviewId),
        escapeStr(review.reviewerId),
        escapeStr(review.name),
        escapeStr(review.reviewerUrl),
        escapeStr(review.reviewerPhotoUrl),
        reviewerNumReviews,
        stars || 'NULL',
        escapeStr(review.text),
        escapeStr(review.responseFromOwnerText),
        responseDate,
        escapeStr(review.publishAt),
        publishedAtDate,
        escapeStr(review.reviewUrl),
        escapeStr(review.language),
        isLocalGuide ? 'TRUE' : 'FALSE'
      ];
      
      valueStrings.push(`(${values.join(', ')})`);
      validReviewCount++;
      
      // Write batch if we've reached batch size
      if (valueStrings.length >= batchSize) {
        fileStream.write(`INSERT INTO review_staging VALUES ${valueStrings.join(', ')};\n`);
        valueStrings = [];
        batchCount++;
        
        if (batchCount % 10 === 0) {
          console.log(`Processed ${batchCount * batchSize} reviews...`);
        }
      }
    }
    
    // Write any remaining reviews
    if (valueStrings.length > 0) {
      fileStream.write(`INSERT INTO review_staging VALUES ${valueStrings.join(', ')};\n`);
      batchCount++;
    }
    
    // Add the command to merge data from staging to the actual table
    fileStream.write(`
      INSERT INTO company_reviews (
        company_id, place_id, review_id, reviewer_id, reviewer_name, 
        reviewer_url, reviewer_photo_url, reviewer_reviews_count, rating, text,
        response_from_owner_text, response_from_owner_date, published_at_text, 
        published_at, review_url, language, is_local_guide
      )
      SELECT * FROM review_staging
      ON CONFLICT (review_id) DO UPDATE 
      SET 
        reviewer_name = EXCLUDED.reviewer_name,
        rating = EXCLUDED.rating,
        text = EXCLUDED.text,
        response_from_owner_text = EXCLUDED.response_from_owner_text,
        response_from_owner_date = EXCLUDED.response_from_owner_date,
        published_at = EXCLUDED.published_at,
        review_url = EXCLUDED.review_url,
        updated_at = CURRENT_TIMESTAMP;
      
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
      );
      
      DROP TABLE review_staging;
      
      COMMIT;
    `);
    
    fileStream.end();
    console.log(`Generated SQL file with ${validReviewCount} reviews in ${batchCount} batches`);
    
    // Phase 5: Execute the SQL file directly (much faster than node)
    console.log('Executing SQL file (this will take a few seconds)...');
    await client.query('ROLLBACK'); // Roll back our earlier transaction
    
    // Execute the SQL file using psql (fastest approach)
    const { execSync } = require('child_process');
    execSync(`PGPASSWORD=${process.env.DATABASE_URL.split(':')[2].split('@')[0]} psql ${process.env.DATABASE_URL} -f ${sqlFilePath}`, { 
      stdio: 'inherit' 
    });
    
    console.log('Import completed successfully!');
    
    // Get final count
    const countResult = await client.query('SELECT COUNT(*) FROM company_reviews');
    console.log(`Total reviews in database: ${countResult.rows[0].count}`);
    
    // Delete the SQL file
    fs.unlinkSync(sqlFilePath);
    console.log('Cleaned up temporary SQL file');
    
  } catch (error) {
    console.error('Error during import:', error);
    await client.query('ROLLBACK').catch(() => {});
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the function
ultraFastImport().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});