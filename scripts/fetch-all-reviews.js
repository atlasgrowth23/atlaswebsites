const { Pool } = require('pg');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { stringify } = require('csv-stringify/sync');

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Create PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Apify API token
const APIFY_TOKEN = 'apify_api_HZceYJ4kjPoaIyeQb98O8TEYfVqX1w1dOvaq';

// API endpoint
const APIFY_ENDPOINT = `https://api.apify.com/v2/acts/compass~google-maps-reviews-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;

// Configuration
const CONFIG = {
  batchSize: 10,            // Number of companies to process in each batch
  maxReviewsPerCompany: 300, // Max reviews per company, matching our filter criteria (5-300)
  delayBetweenBatches: 5000, // Delay between batches in ms
  exportCsv: true,          // Export reviews to CSV
  consolidatedCsv: true,    // Use a single CSV file instead of individual files
  logLevel: 'verbose',      // 'verbose' or 'normal'
  limit: 0,                 // Maximum number of companies to process (0 = no limit)
  stateFilter: null,        // Optional state filter (e.g., 'Alabama') - set to null to process all states
  skipExisting: true,       // Skip companies that already have reviews
  minReviews: 5             // Minimum reviews matching our filter criteria
};

/**
 * Log message with optional verbose check
 */
function log(message, level = 'normal') {
  if (level === 'verbose' && CONFIG.logLevel !== 'verbose') {
    return;
  }
  console.log(message);
}

/**
 * Get companies with place_ids from our filtered list
 */
async function getCompaniesWithPlaceIds() {
  // Create the filtered_companies table if it doesn't exist yet
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS filtered_companies (
        company_id TEXT PRIMARY KEY,
        place_id TEXT,
        added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
  } catch (err) {
    console.error('Error creating filtered_companies table:', err.message);
  }
  
  // Try to populate filtered_companies table if it's empty
  try {
    const countResult = await pool.query('SELECT COUNT(*) FROM filtered_companies');
    if (parseInt(countResult.rows[0].count) === 0) {
      console.log('Filtered companies table is empty. Loading from combined CSV file...');
      
      // Check if the combined file exists
      const fs = require('fs');
      const path = require('path');
      const combinedFile = path.join(process.cwd(), 'combined_filtered_hvac.csv');
      
      if (fs.existsSync(combinedFile)) {
        // Parse the combined file
        const { parse } = require('csv-parse/sync');
        const combinedContent = fs.readFileSync(combinedFile, 'utf8');
        const records = parse(combinedContent, { columns: true, skip_empty_lines: true });
        
        console.log(`Found ${records.length} companies in combined file. Adding to filtered_companies table...`);
        
        // Add records to filtered_companies table
        for (const record of records) {
          if (record.id && record.place_id) {
            await pool.query(
              'INSERT INTO filtered_companies (company_id, place_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [record.id, record.place_id]
            );
          }
        }
        
        console.log('Added companies to filtered_companies table');
      } else {
        console.log(`Combined file not found: ${combinedFile}`);
      }
    }
  } catch (err) {
    console.error('Error populating filtered_companies table:', err.message);
  }
  
  // Get only companies that are in our filtered list
  let query = `
    SELECT c.id, c.name, c.place_id, c.state, c.city
    FROM companies c
    JOIN filtered_companies fc ON c.id = fc.company_id
    WHERE c.place_id IS NOT NULL AND c.place_id != ''
  `;
  
  const params = [];
  
  // Add state filter if specified
  if (CONFIG.stateFilter) {
    query += ' AND c.state = $1';
    params.push(CONFIG.stateFilter);
  }
  
  // Add limit if specified
  if (CONFIG.limit > 0) {
    query += ' LIMIT $' + (params.length + 1);
    params.push(CONFIG.limit);
  }
  
  const result = await pool.query(query, params);
  console.log(`Found ${result.rows.length} companies from our filtered list with place_ids`);
  return result.rows;
}

/**
 * Get companies that already have reviews
 */
async function getCompaniesWithExistingReviews() {
  const result = await pool.query(`
    SELECT DISTINCT place_id
    FROM company_reviews
  `);
  
  return new Set(result.rows.map(row => row.place_id));
}

/**
 * Fetch reviews for a company from Apify
 */
async function fetchReviewsFromApify(company) {
  try {
    log(`Fetching reviews for ${company.name} (${company.place_id})...`);
    
    const requestBody = {
      placeId: company.place_id,
      startUrls: [{ url: `https://www.google.com/maps/place/?q=place_id:${company.place_id}` }],
      language: "en",
      dialect: "us"
    };
    
    // Add max reviews limit if configured
    if (CONFIG.maxReviewsPerCompany > 0) {
      requestBody.maxReviews = CONFIG.maxReviewsPerCompany;
    }
    
    log(`API request for ${company.name}`, 'verbose');
    
    // Make the API request
    const response = await axios.post(APIFY_ENDPOINT, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Check for valid response
    if (response.status !== 200 && response.status !== 201) {
      console.error(`API request failed with status: ${response.status}`);
      return [];
    }
    
    // Handle the response data
    const data = response.data;
    
    // Determine where the reviews array is in the response
    let reviews = [];
    if (Array.isArray(data)) {
      reviews = data;
    } else if (data && typeof data === 'object') {
      if (data.items && Array.isArray(data.items)) {
        reviews = data.items;
      } else if (data.results && Array.isArray(data.results)) {
        reviews = data.results;
      } else if (data.data && Array.isArray(data.data)) {
        reviews = data.data;
      }
    }
    
    log(`Received ${reviews.length} reviews for ${company.name}`);
    return reviews;
    
  } catch (error) {
    console.error(`Error fetching reviews for ${company.name}:`, error.message);
    return [];
  }
}

/**
 * Save reviews to the database
 */
async function saveReviewsToDatabase(company, reviews) {
  if (reviews.length === 0) {
    return { added: 0, skipped: 0 };
  }
  
  log(`Saving ${reviews.length} reviews for ${company.name} to database...`);
  
  let added = 0;
  let skipped = 0;
  
  // Get all existing review IDs for this company to avoid duplicates
  const existingResult = await pool.query(
    'SELECT review_id FROM company_reviews WHERE place_id = $1',
    [company.place_id]
  );
  
  const existingReviewIds = new Set(existingResult.rows.map(r => r.review_id));
  
  // Insert each review
  for (const review of reviews) {
    try {
      // Skip if this review already exists
      if (existingReviewIds.has(review.reviewId)) {
        skipped++;
        continue;
      }
      
      // Insert the review
      await pool.query(`
        INSERT INTO company_reviews (
          review_id, company_id, place_id, reviewer_name, review_text, 
          rating, published_at, reviewer_photo_url, response_from_owner_text,
          response_from_owner_date, review_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (review_id) DO NOTHING
      `, [
        review.reviewId,
        company.id,
        company.place_id,
        review.reviewerName || review.name,
        review.reviewText || review.text,
        review.stars || review.rating,
        review.publishedAtDate ? new Date(review.publishedAtDate) : null,
        review.reviewerPhotoUrl,
        review.responseFromOwnerText,
        review.responseFromOwnerDate ? new Date(review.responseFromOwnerDate) : null,
        review.reviewUrl
      ]);
      
      added++;
    } catch (err) {
      console.error(`Error saving review for ${company.name}:`, err.message);
    }
  }
  
  log(`Saved ${added} new reviews for ${company.name} (${skipped} already existed)`);
  return { added, skipped };
}

// Global variable to store all reviews for consolidated CSV
const allReviewsForCsv = [];

/**
 * Export reviews to CSV
 */
async function exportReviewsToCsv(company, reviews) {
  if (!CONFIG.exportCsv || reviews.length === 0) {
    return null;
  }
  
  try {
    // Format data for CSV and add to global array
    const csvData = reviews.map(review => ({
      company_id: company.id,
      company_name: company.name,
      place_id: company.place_id,
      state: company.state,
      city: company.city,
      review_id: review.reviewId,
      reviewer_name: review.reviewerName || review.name || '',
      rating: review.stars || review.rating || '',
      review_text: review.reviewText || review.text || '',
      published_at: review.publishedAtDate || '',
      reviewer_photo: review.reviewerPhotoUrl || '',
      response_text: review.responseFromOwnerText || '',
      response_date: review.responseFromOwnerDate || '',
      review_url: review.reviewUrl || ''
    }));
    
    // Add to the consolidated reviews array
    allReviewsForCsv.push(...csvData);
    
    log(`Added ${reviews.length} reviews to consolidated CSV data for ${company.name}`, 'verbose');
    
    return true;
  } catch (err) {
    console.error(`Error processing reviews for CSV for ${company.name}:`, err.message);
    return null;
  }
}

/**
 * Write the consolidated CSV file with all reviews
 */
async function writeConsolidatedCsv() {
  if (!CONFIG.exportCsv || !CONFIG.consolidatedCsv || allReviewsForCsv.length === 0) {
    return null;
  }
  
  try {
    // Create CSV output with headers
    const csvOutput = stringify(allReviewsForCsv, { header: true });
    
    // Create directory if it doesn't exist
    const csvDir = path.join(process.cwd(), 'reviews_csv');
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir);
    }
    
    // Define the consolidated CSV filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const statePrefix = CONFIG.stateFilter ? `${CONFIG.stateFilter.toLowerCase()}_` : '';
    const csvPath = path.join(csvDir, `${statePrefix}all_reviews_${timestamp}.csv`);
    
    // Write to file
    fs.writeFileSync(csvPath, csvOutput);
    console.log(`\nExported ${allReviewsForCsv.length} reviews to consolidated CSV: ${csvPath}`);
    
    return csvPath;
  } catch (err) {
    console.error('Error exporting consolidated CSV:', err.message);
    return null;
  }
}

/**
 * Process a batch of companies
 */
async function processBatch(companies, existingReviews) {
  log(`Processing batch of ${companies.length} companies...`);
  
  let totalReviews = 0;
  let totalAdded = 0;
  let totalSkipped = 0;
  let companiesWithReviews = 0;
  
  for (const company of companies) {
    // Skip if company already has reviews and skipExisting is enabled
    if (CONFIG.skipExisting && existingReviews.has(company.place_id)) {
      log(`Skipping ${company.name} - already has reviews`, 'verbose');
      continue;
    }
    
    // Fetch reviews
    const reviews = await fetchReviewsFromApify(company);
    
    if (reviews.length > 0) {
      // Save to database
      const { added, skipped } = await saveReviewsToDatabase(company, reviews);
      
      // Export to CSV
      await exportReviewsToCsv(company, reviews);
      
      totalReviews += reviews.length;
      totalAdded += added;
      totalSkipped += skipped;
      companiesWithReviews++;
    }
  }
  
  log(`\nBatch summary:`);
  log(`Companies processed: ${companies.length}`);
  log(`Companies with reviews: ${companiesWithReviews}`);
  log(`Total reviews found: ${totalReviews}`);
  log(`Reviews added to database: ${totalAdded}`);
  log(`Reviews skipped (already existed): ${totalSkipped}`);
  
  return { totalReviews, totalAdded, totalSkipped, companiesWithReviews };
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting Google Reviews fetch for all companies...');
    console.log('Configuration:', JSON.stringify(CONFIG, null, 2));
    
    // Get all companies with place_ids
    const companies = await getCompaniesWithPlaceIds();
    console.log(`Found ${companies.length} companies with place_ids`);
    
    // Get companies that already have reviews
    const existingReviews = CONFIG.skipExisting ? 
      await getCompaniesWithExistingReviews() : new Set();
    
    if (CONFIG.skipExisting) {
      console.log(`Found ${existingReviews.size} companies that already have reviews`);
    }
    
    // Process in batches
    const batches = [];
    for (let i = 0; i < companies.length; i += CONFIG.batchSize) {
      batches.push(companies.slice(i, i + CONFIG.batchSize));
    }
    
    console.log(`Processing ${batches.length} batches of ${CONFIG.batchSize} companies each`);
    
    let overallStats = {
      totalReviews: 0,
      totalAdded: 0,
      totalSkipped: 0,
      companiesWithReviews: 0
    };
    
    // Process each batch
    for (let i = 0; i < batches.length; i++) {
      console.log(`\nProcessing batch ${i + 1} of ${batches.length}...`);
      
      const batchStats = await processBatch(batches[i], existingReviews);
      
      // Update overall stats
      overallStats.totalReviews += batchStats.totalReviews;
      overallStats.totalAdded += batchStats.totalAdded;
      overallStats.totalSkipped += batchStats.totalSkipped;
      overallStats.companiesWithReviews += batchStats.companiesWithReviews;
      
      // Add delay between batches
      if (i < batches.length - 1) {
        log(`Waiting ${CONFIG.delayBetweenBatches}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenBatches));
      }
    }
    
    // Write consolidated CSV file if enabled
    if (CONFIG.exportCsv && CONFIG.consolidatedCsv) {
      await writeConsolidatedCsv();
    }
    
    // Final summary
    console.log('\n=== FINAL SUMMARY ===');
    console.log(`Total companies processed: ${companies.length}`);
    console.log(`Companies with reviews: ${overallStats.companiesWithReviews}`);
    console.log(`Total reviews found: ${overallStats.totalReviews}`);
    console.log(`Reviews added to database: ${overallStats.totalAdded}`);
    console.log(`Reviews skipped (already existed): ${overallStats.totalSkipped}`);
    
    // Fetch review stats from database
    const statsResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT place_id) as companies_with_reviews,
        COUNT(*) as total_reviews,
        ROUND(AVG(rating)::numeric, 2) as average_rating
      FROM company_reviews
    `);
    
    console.log('\nDatabase Review Stats:');
    console.log(`Companies with reviews in database: ${statsResult.rows[0].companies_with_reviews}`);
    console.log(`Total reviews in database: ${statsResult.rows[0].total_reviews}`);
    console.log(`Average rating across all reviews: ${statsResult.rows[0].average_rating}`);
    
    // State distribution
    const stateResult = await pool.query(`
      SELECT state, COUNT(DISTINCT rs.place_id) as companies, SUM(rs.total_reviews) as reviews
      FROM company_review_stats rs
      JOIN companies c ON rs.place_id = c.place_id
      WHERE state IS NOT NULL AND state != ''
      GROUP BY state
      ORDER BY companies DESC
    `);
    
    console.log('\nReviews by State:');
    stateResult.rows.forEach(row => {
      console.log(`${row.state}: ${row.companies} companies, ${row.reviews} reviews`);
    });
    
  } catch (err) {
    console.error('Error in main function:', err);
  } finally {
    await pool.end();
    console.log('Database connection closed');
  }
}

// Run the script
main().catch(console.error);