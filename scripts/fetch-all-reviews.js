const { Pool } = require('pg');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Apify API token
const APIFY_TOKEN = 'apify_api_HZceYJ4kjPoaIyeQb98O8TEYfVqX1w1dOvaq';

// API endpoint
const APIFY_ENDPOINT = `https://api.apify.com/v2/acts/compass~google-maps-reviews-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;

// Configuration
const CONFIG = {
  batchSize: 5,            // Number of companies to process in each batch
  maxReviewsPerCompany: 0, // Maximum reviews per company (0 = all reviews)
  delayBetweenBatches: 2000, // Delay between batches in ms
  exportCsv: false,         // Export reviews to CSV
  limitCompanies: 0,       // How many companies to process (0 = all)
  stateFilter: null,       // Optional state filter (e.g., 'Alabama')
  skipExisting: true,      // Skip companies that already have reviews
  minReviewsFilter: 10     // Minimum number of reviews in google
};

/**
 * Execute a database query with error handling
 */
async function query(text, params = []) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (err) {
    console.error(`Error executing query: ${err.message}`);
    return { rows: [] };
  }
}

/**
 * Get companies with place_ids
 */
async function getCompaniesWithPlaceIds() {
  // Build the query based on configuration
  let queryText = `
    SELECT id, name, place_id, state, city, reviews as review_count
    FROM companies
    WHERE place_id IS NOT NULL AND place_id != ''
  `;
  
  const queryParams = [];
  
  // Add review count filter if specified
  if (CONFIG.minReviewsFilter > 0) {
    queryText += ` AND reviews >= $${queryParams.length + 1}`;
    queryParams.push(CONFIG.minReviewsFilter);
  }
  
  // Add state filter if specified
  if (CONFIG.stateFilter) {
    queryText += ` AND state = $${queryParams.length + 1}`;
    queryParams.push(CONFIG.stateFilter);
  }
  
  // Add limit if specified
  if (CONFIG.limitCompanies > 0) {
    queryText += ` ORDER BY reviews DESC LIMIT $${queryParams.length + 1}`;
    queryParams.push(CONFIG.limitCompanies);
  } else {
    queryText += ` ORDER BY reviews DESC`;
  }
  
  // Execute the query
  const result = await query(queryText, queryParams);
  return result.rows;
}

/**
 * Get companies that already have reviews
 */
async function getCompaniesWithExistingReviews() {
  const result = await query(`
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
    console.log(`Fetching reviews for ${company.name} (${company.place_id})...`);
    
    // Prepare the API request
    const requestBody = {
      placeId: company.place_id,
      startUrls: [{ url: `https://www.google.com/maps/place/?q=place_id:${company.place_id}` }],
      language: "en",
      dialect: "us"
    };
    
    // Add max reviews limit if configured and greater than 0
    if (CONFIG.maxReviewsPerCompany > 0) {
      requestBody.maxReviews = CONFIG.maxReviewsPerCompany;
    }
    
    // Make the API request
    const response = await axios.post(APIFY_ENDPOINT, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 300000 // 5 minute timeout
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
    
    console.log(`Received ${reviews.length} reviews for ${company.name}`);
    
    // Save a copy of the raw response for debugging
    const filename = `apify-response-${company.id}.json`;
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`Saved raw response to ${filename}`);
    
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
  
  console.log(`Saving ${reviews.length} reviews for ${company.name} to database...`);
  
  let added = 0;
  let skipped = 0;
  
  // Get all existing review IDs for this company to avoid duplicates
  const existingResult = await query(
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
      await query(`
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
  
  console.log(`Saved ${added} new reviews for ${company.name} (${skipped} already existed)`);
  
  // Update company review stats
  await updateCompanyReviewStats(company.id, company.place_id);
  
  return { added, skipped };
}

/**
 * Update review statistics for a company
 */
async function updateCompanyReviewStats(companyId, placeId) {
  try {
    // Get review statistics
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_reviews,
        ROUND(AVG(rating)::numeric, 2) as average_rating,
        COUNT(*) FILTER (WHERE rating = 1) as rating_1_count,
        COUNT(*) FILTER (WHERE rating = 2) as rating_2_count,
        COUNT(*) FILTER (WHERE rating = 3) as rating_3_count,
        COUNT(*) FILTER (WHERE rating = 4) as rating_4_count,
        COUNT(*) FILTER (WHERE rating = 5) as rating_5_count,
        MAX(published_at) as last_review_date
      FROM company_reviews
      WHERE place_id = $1
    `, [placeId]);
    
    if (statsResult.rows.length === 0) {
      return;
    }
    
    const stats = statsResult.rows[0];
    
    // Update or insert review stats
    await query(`
      INSERT INTO company_review_stats (
        place_id, company_id, total_reviews, average_rating,
        rating_1_count, rating_2_count, rating_3_count, rating_4_count, rating_5_count,
        last_review_date, last_updated
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()
      )
      ON CONFLICT (place_id) DO UPDATE SET
        company_id = EXCLUDED.company_id,
        total_reviews = EXCLUDED.total_reviews,
        average_rating = EXCLUDED.average_rating,
        rating_1_count = EXCLUDED.rating_1_count,
        rating_2_count = EXCLUDED.rating_2_count,
        rating_3_count = EXCLUDED.rating_3_count,
        rating_4_count = EXCLUDED.rating_4_count,
        rating_5_count = EXCLUDED.rating_5_count,
        last_review_date = EXCLUDED.last_review_date,
        last_updated = NOW()
    `, [
      placeId,
      companyId,
      stats.total_reviews,
      stats.average_rating,
      stats.rating_1_count,
      stats.rating_2_count,
      stats.rating_3_count,
      stats.rating_4_count,
      stats.rating_5_count,
      stats.last_review_date
    ]);
    
    console.log(`Updated review stats for company ${companyId} (${placeId}): ${stats.total_reviews} reviews, avg rating ${stats.average_rating}`);
    
  } catch (err) {
    console.error(`Error updating review stats for company ${companyId}:`, err.message);
  }
}

/**
 * Process a batch of companies
 */
async function processBatch(companies, existingReviews) {
  console.log(`Processing batch of ${companies.length} companies...`);
  
  let totalReviews = 0;
  let totalAdded = 0;
  let totalSkipped = 0;
  let companiesWithReviews = 0;
  
  for (const company of companies) {
    // Skip if company already has reviews and skipExisting is enabled
    if (CONFIG.skipExisting && existingReviews.has(company.place_id)) {
      console.log(`Skipping ${company.name} - already has reviews`);
      continue;
    }
    
    // Fetch reviews
    const reviews = await fetchReviewsFromApify(company);
    
    if (reviews.length > 0) {
      // Save to database
      const { added, skipped } = await saveReviewsToDatabase(company, reviews);
      
      totalReviews += reviews.length;
      totalAdded += added;
      totalSkipped += skipped;
      companiesWithReviews++;
    }
  }
  
  console.log(`\nBatch summary:`);
  console.log(`Companies processed: ${companies.length}`);
  console.log(`Companies with reviews: ${companiesWithReviews}`);
  console.log(`Total reviews found: ${totalReviews}`);
  console.log(`Reviews added to database: ${totalAdded}`);
  console.log(`Reviews skipped (already existed): ${totalSkipped}`);
  
  return { totalReviews, totalAdded, totalSkipped, companiesWithReviews };
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting Google Reviews fetch...');
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
        console.log(`Waiting ${CONFIG.delayBetweenBatches}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenBatches));
      }
    }
    
    // Final summary
    console.log('\n=== FINAL SUMMARY ===');
    console.log(`Total companies processed: ${companies.length}`);
    console.log(`Companies with reviews: ${overallStats.companiesWithReviews}`);
    console.log(`Total reviews found: ${overallStats.totalReviews}`);
    console.log(`Reviews added to database: ${overallStats.totalAdded}`);
    console.log(`Reviews skipped (already existed): ${overallStats.totalSkipped}`);
    
    // Fetch review stats from database
    const statsResult = await query(`
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
    const stateResult = await query(`
      SELECT c.state, COUNT(DISTINCT crs.place_id) as companies, SUM(crs.total_reviews) as reviews
      FROM company_review_stats crs
      JOIN companies c ON crs.place_id = c.place_id
      WHERE c.state IS NOT NULL AND c.state != ''
      GROUP BY c.state
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