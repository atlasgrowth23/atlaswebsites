const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create a PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Configuration
const CHUNK_SIZE = 1000; // Number of reviews to process per run
const JSON_FILE_PATH = path.join(__dirname, '../dataset_Google-Maps-Reviews-Scraper_2025-05-14_17-36-14-844.json');
const CHECKPOINT_FILE = path.join(__dirname, '../review_import_checkpoint.json');

/**
 * Execute a query with error handling
 */
async function query(text, params = []) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database error:', error.message);
    throw error;
  }
}

/**
 * Generate a unique review ID from review details when one isn't provided
 */
function generateReviewId(review, companyId) {
  // Combine reviewer name, place ID, publish date and some text to create a unique ID
  const nameHash = review.name ? review.name.replace(/\s+/g, '_').toLowerCase() : 'anonymous';
  const dateStr = review.publishedAtDate ? new Date(review.publishedAtDate).getTime() : Date.now();
  const textSample = review.text ? review.text.slice(0, 10).replace(/\s+/g, '_').toLowerCase() : 'no_text';
  return `${companyId}_${nameHash}_${dateStr}_${textSample}`.replace(/[^\w-]/g, '');
}

/**
 * Import a chunk of Google Reviews
 */
async function importReviewsChunk() {
  try {
    // Load checkpoint if exists
    let startIndex = 0;
    let endIndex = CHUNK_SIZE;
    
    if (fs.existsSync(CHECKPOINT_FILE)) {
      const checkpoint = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
      startIndex = checkpoint.nextIndex;
      console.log(`Resuming from checkpoint: starting at index ${startIndex}`);
    }
    
    console.log(`Starting Google Reviews chunk import (${startIndex} to ${startIndex + CHUNK_SIZE})...`);
    
    // Read and parse the JSON file
    const fileContent = fs.readFileSync(JSON_FILE_PATH, 'utf8');
    const allReviews = JSON.parse(fileContent);
    
    console.log(`Total reviews in file: ${allReviews.length}`);
    
    // Check if we've reached the end
    if (startIndex >= allReviews.length) {
      console.log('All reviews have been processed.');
      // Delete checkpoint file if we're done
      if (fs.existsSync(CHECKPOINT_FILE)) {
        fs.unlinkSync(CHECKPOINT_FILE);
      }
      await pool.end();
      return;
    }
    
    // Calculate end index for this chunk
    endIndex = Math.min(startIndex + CHUNK_SIZE, allReviews.length);
    const reviewsToProcess = allReviews.slice(startIndex, endIndex);
    
    console.log(`Processing chunk from index ${startIndex} to ${endIndex - 1} (${reviewsToProcess.length} reviews)`);
    
    // Get list of companies and their place_ids for mapping
    const companiesResult = await query('SELECT id, place_id FROM companies WHERE place_id IS NOT NULL');
    
    // Create a map of place_ids to company_ids for quick lookup
    const companyPlaceIdMap = {};
    companiesResult.rows.forEach(company => {
      companyPlaceIdMap[company.place_id] = company.id;
    });
    
    console.log(`Found ${Object.keys(companyPlaceIdMap).length} companies with place_ids`);
    
    // Create a batch size for processing
    const BATCH_SIZE = 100;
    let batch = [];
    let importedCount = 0;
    let skippedCount = 0;
    const processedReviewIds = new Set();
    
    // Process reviews and prepare batches
    for (const review of reviewsToProcess) {
      try {
        // Skip if no placeId
        if (!review.placeId) {
          skippedCount++;
          continue;
        }
        
        // Find the company_id for this place_id
        const companyId = companyPlaceIdMap[review.placeId];
        
        // Skip if no matching company found
        if (!companyId) {
          skippedCount++;
          continue;
        }
        
        // Generate or use review ID
        const reviewId = review.reviewId || generateReviewId(review, companyId);
        
        // Skip if we've already processed this review ID
        if (processedReviewIds.has(reviewId)) {
          skippedCount++;
          continue;
        }
        
        // Add to processed set
        processedReviewIds.add(reviewId);
        
        // Extract values from the review object
        const isLocalGuide = review.isLocalGuide === true || review.isLocalGuide === "true";
        const stars = parseInt(review.stars) || null;
        const publishedAtDate = review.publishedAtDate ? new Date(review.publishedAtDate) : null;
        const responseDate = review.responseFromOwnerDate ? new Date(review.responseFromOwnerDate) : null;
        const reviewerNumReviews = review.reviewerNumberOfReviews ? parseInt(review.reviewerNumberOfReviews) : null;
        
        // Add to batch
        batch.push({
          companyId,
          placeId: review.placeId,
          reviewId,
          reviewerId: review.reviewerId || null,
          reviewerName: review.name || null,
          reviewerUrl: review.reviewerUrl || null,
          reviewerPhotoUrl: review.reviewerPhotoUrl || null,
          reviewerReviewsCount: reviewerNumReviews,
          rating: stars,
          text: review.text || null,
          responseFromOwnerText: review.responseFromOwnerText || null,
          responseFromOwnerDate: responseDate,
          publishedAtText: review.publishAt || null,
          publishedAt: publishedAtDate,
          reviewUrl: review.reviewUrl || null,
          language: review.language || null,
          isLocalGuide
        });
        
        // Process batch when it reaches the specified size
        if (batch.length >= BATCH_SIZE) {
          const processedCount = await processBatch(batch);
          importedCount += processedCount;
          console.log(`Progress: ${importedCount + skippedCount}/${reviewsToProcess.length}, imported: ${importedCount}, skipped: ${skippedCount}`);
          batch = [];
        }
      } catch (error) {
        console.error(`Error processing review:`, error.message);
        skippedCount++;
      }
    }
    
    // Process any remaining records in the batch
    if (batch.length > 0) {
      const processedCount = await processBatch(batch);
      importedCount += processedCount;
    }
    
    console.log(`Completed processing ${reviewsToProcess.length} reviews in this chunk`);
    console.log(`Successfully imported ${importedCount} reviews, skipped ${skippedCount} reviews`);
    
    // Save checkpoint for next run
    const checkpoint = {
      nextIndex: endIndex,
      totalReviews: allReviews.length,
      processedReviews: endIndex,
      remainingReviews: allReviews.length - endIndex,
      lastProcessed: new Date().toISOString()
    };
    
    fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
    console.log(`Checkpoint saved. Next run will start at index ${endIndex}`);
    
    // Update companies table with review counts
    const updateQuery = `
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
    `;
    
    await query(updateQuery);
    console.log('Updated companies table with review counts');
    console.log('Chunk import completed');
    
    // Close the database connection
    await pool.end();
    
  } catch (error) {
    console.error('Import process failed:', error.message);
    // Ensure the pool is closed even on error
    if (pool) await pool.end();
    process.exit(1);
  }
}

/**
 * Process a batch of records using a single transaction
 * @param {Array} batch - Array of review records to insert
 * @returns {Promise<number>} - Number of successfully inserted records
 */
async function processBatch(batch) {
  const client = await pool.connect();
  let successCount = 0;
  
  try {
    await client.query('BEGIN');
    
    for (const record of batch) {
      const insertQuery = `
        INSERT INTO company_reviews (
          company_id,
          place_id,
          review_id,
          reviewer_id,
          reviewer_name,
          reviewer_url,
          reviewer_photo_url,
          reviewer_reviews_count,
          rating,
          text,
          response_from_owner_text,
          response_from_owner_date,
          published_at_text,
          published_at,
          review_url,
          language,
          is_local_guide
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
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
      
      const values = [
        record.companyId,
        record.placeId,
        record.reviewId,
        record.reviewerId,
        record.reviewerName,
        record.reviewerUrl,
        record.reviewerPhotoUrl,
        record.reviewerReviewsCount,
        record.rating,
        record.text,
        record.responseFromOwnerText,
        record.responseFromOwnerDate,
        record.publishedAtText,
        record.publishedAt,
        record.reviewUrl,
        record.language,
        record.isLocalGuide
      ];
      
      try {
        await client.query(insertQuery, values);
        successCount++;
      } catch (error) {
        console.error(`Error inserting review ${record.reviewId}:`, error.message);
      }
    }
    
    await client.query('COMMIT');
    return successCount;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Batch transaction error:', error.message);
    return 0;
  } finally {
    client.release();
  }
}

// Run the import function
importReviewsChunk().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});