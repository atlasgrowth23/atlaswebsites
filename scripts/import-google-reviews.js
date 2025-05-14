const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create a PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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
 * Import Google Reviews from CSV file
 */
async function importGoogleReviews() {
  try {
    console.log('Starting Google Reviews import process...');
    
    // Path to the CSV file
    const csvFilePath = path.join(__dirname, '../dataset_Google-Maps-Reviews-Scraper_2025-05-14_17-36-14-844.csv');
    
    console.log(`Reading file: ${csvFilePath}`);
    
    // Create a readable stream from the CSV file
    const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
    
    // Get list of companies and their place_ids for mapping
    const companiesResult = await query('SELECT id, place_id FROM companies WHERE place_id IS NOT NULL');
    
    // Create a map of place_ids to company_ids for quick lookup
    const companyPlaceIdMap = {};
    companiesResult.rows.forEach(company => {
      companyPlaceIdMap[company.place_id] = company.id;
    });
    
    console.log(`Found ${Object.keys(companyPlaceIdMap).length} companies with place_ids`);
    
    // Parse the CSV file
    parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true // Handle uneven column counts
    }, async (err, records) => {
      if (err) {
        console.error('Error parsing CSV:', err);
        process.exit(1);
      }
      
      console.log(`Found ${records.length} reviews to import`);
      
      // Begin a transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        let importedCount = 0;
        let skippedCount = 0;
        
        // Create a set to track processed review IDs to avoid duplicates
        const processedReviewIds = new Set();
        
        // Loop through each record and insert into the database
        for (const record of records) {
          // Skip if no placeId or reviewId
          if (!record.placeId || !record.reviewId) {
            skippedCount++;
            continue;
          }
          
          // Skip if we've already processed this review ID
          if (processedReviewIds.has(record.reviewId)) {
            skippedCount++;
            continue;
          }
          
          // Add to processed set
          processedReviewIds.add(record.reviewId);
          
          // Find the company_id for this place_id
          const companyId = companyPlaceIdMap[record.placeId];
          
          // Skip if no matching company found
          if (!companyId) {
            skippedCount++;
            continue;
          }
          
          // Map CSV fields to database fields
          const query = `
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
          
          const isLocalGuide = record.isLocalGuide === "true";
          const stars = parseInt(record.stars) || null;
          const publishedAtDate = record.publishedAtDate ? new Date(record.publishedAtDate) : null;
          const responseDate = record.responseFromOwnerDate ? new Date(record.responseFromOwnerDate) : null;
          const reviewerNumReviews = record.reviewerNumberOfReviews ? parseInt(record.reviewerNumberOfReviews) : null;
          
          const values = [
            companyId,
            record.placeId,
            record.reviewId,
            record.reviewerId || null,
            record.name || null,
            record.reviewerUrl || null,
            record.reviewerPhotoUrl || null,
            reviewerNumReviews,
            stars,
            record.text || null,
            record.responseFromOwnerText || null,
            responseDate,
            record.publishAt || null,
            publishedAtDate,
            record.reviewUrl || null,
            record.language || null,
            isLocalGuide
          ];
          
          try {
            await client.query(query, values);
            importedCount++;
            
            // Log progress every 1000 reviews
            if (importedCount % 1000 === 0) {
              console.log(`Imported ${importedCount} reviews so far...`);
            }
          } catch (err) {
            console.error(`Error importing review ${record.reviewId}:`, err.message);
            skippedCount++;
          }
        }
        
        // Commit the transaction
        await client.query('COMMIT');
        console.log(`Successfully imported ${importedCount} reviews, skipped ${skippedCount} reviews`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Transaction error:', error.message);
      } finally {
        client.release();
      }
      
      // Update companies table with review counts
      try {
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
      } catch (error) {
        console.error('Error updating company review counts:', error.message);
      }
      
      // Close the database pool
      await pool.end();
      console.log('Import process completed');
    });
  } catch (error) {
    console.error('Import process failed:', error.message);
    process.exit(1);
  }
}

// Run the import function
importGoogleReviews().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});