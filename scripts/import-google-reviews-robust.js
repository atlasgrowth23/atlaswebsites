const fs = require('fs');
const path = require('path');
const readline = require('readline');
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
 * Import Google Reviews by processing the CSV file line by line
 */
async function importReviewsLineByLine() {
  try {
    console.log('Starting robust Google Reviews import process...');
    
    // Path to the CSV file
    const csvFilePath = path.join(__dirname, '../dataset_Google-Maps-Reviews-Scraper_2025-05-14_17-36-14-844.csv');
    
    console.log(`Reading file: ${csvFilePath}`);
    
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
    let totalProcessed = 0;
    let importedCount = 0;
    let skippedCount = 0;
    const processedReviewIds = new Set();
    
    // Create file stream and readline interface
    const fileStream = fs.createReadStream(csvFilePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    // Keep track of header columns for mapping
    let headerColumns = [];
    let isFirstLine = true;
    
    // Process the file line by line with manual csv parsing
    for await (const line of rl) {
      // Skip empty lines
      if (!line.trim()) continue;
      
      // Process header line
      if (isFirstLine) {
        // Handle BOM if present
        let headerLine = line;
        if (headerLine.charCodeAt(0) === 0xFEFF) {
          headerLine = headerLine.slice(1);
        }
        headerColumns = parseCSVLine(headerLine);
        isFirstLine = false;
        continue;
      }
      
      try {
        // Parse the line manually to handle potential CSV format issues
        const values = parseCSVLine(line);
        
        // Create a record object mapping headers to values
        const record = {};
        headerColumns.forEach((header, index) => {
          if (index < values.length) {
            record[header] = values[index];
          }
        });
        
        // Skip if no placeId or reviewId
        if (!record.placeId || !record.reviewId) {
          skippedCount++;
          totalProcessed++;
          continue;
        }
        
        // Skip if we've already processed this review ID
        if (processedReviewIds.has(record.reviewId)) {
          skippedCount++;
          totalProcessed++;
          continue;
        }
        
        // Add to processed set
        processedReviewIds.add(record.reviewId);
        
        // Find the company_id for this place_id
        const companyId = companyPlaceIdMap[record.placeId];
        
        // Skip if no matching company found
        if (!companyId) {
          skippedCount++;
          totalProcessed++;
          continue;
        }
        
        // Prepare record for batch insertion
        const isLocalGuide = record.isLocalGuide === "true";
        const stars = parseInt(record.stars) || null;
        const publishedAtDate = record.publishedAtDate ? new Date(record.publishedAtDate) : null;
        const responseDate = record.responseFromOwnerDate ? new Date(record.responseFromOwnerDate) : null;
        const reviewerNumReviews = record.reviewerNumberOfReviews ? parseInt(record.reviewerNumberOfReviews) : null;
        
        batch.push({
          companyId,
          placeId: record.placeId,
          reviewId: record.reviewId,
          reviewerId: record.reviewerId || null,
          reviewerName: record.name || null,
          reviewerUrl: record.reviewerUrl || null,
          reviewerPhotoUrl: record.reviewerPhotoUrl || null,
          reviewerReviewsCount: reviewerNumReviews,
          rating: stars,
          text: record.text || null,
          responseFromOwnerText: record.responseFromOwnerText || null,
          responseFromOwnerDate: responseDate,
          publishedAtText: record.publishAt || null,
          publishedAt: publishedAtDate,
          reviewUrl: record.reviewUrl || null,
          language: record.language || null,
          isLocalGuide
        });
        
        totalProcessed++;
        
        // Process batch when it reaches the specified size
        if (batch.length >= BATCH_SIZE) {
          const processedCount = await processBatch(batch);
          importedCount += processedCount;
          console.log(`Processed ${totalProcessed} lines, imported ${importedCount} reviews, skipped ${skippedCount} reviews`);
          batch = [];
        }
      } catch (error) {
        console.error(`Error processing line: ${line.slice(0, 100)}...`, error.message);
        skippedCount++;
        totalProcessed++;
      }
    }
    
    // Process any remaining records in the batch
    if (batch.length > 0) {
      const processedCount = await processBatch(batch);
      importedCount += processedCount;
    }
    
    console.log(`Completed processing ${totalProcessed} lines`);
    console.log(`Successfully imported ${importedCount} reviews, skipped ${skippedCount} reviews`);
    
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
    console.log('Import process completed');
    
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

/**
 * Parse a CSV line manually to handle various formatting issues
 * @param {string} line - CSV line to parse
 * @returns {Array} - Array of parsed values
 */
function parseCSVLine(line) {
  const result = [];
  let currentValue = '';
  let insideQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        currentValue += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // End of value
      result.push(currentValue);
      currentValue = '';
    } else {
      // Add character to current value
      currentValue += char;
    }
  }
  
  // Add the last value
  result.push(currentValue);
  return result;
}

// Run the import function
importReviewsLineByLine().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});