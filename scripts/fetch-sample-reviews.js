const { Pool } = require('pg');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Configuration for a small sample
const CONFIG = {
  batchSize: 3,            // Number of companies to process in each batch
  maxReviewsPerCompany: 10, // Maximum reviews per company
  limitCompanies: 3,       // How many companies to process
  stateFilter: null,       // Optional state filter (e.g., 'Alabama')
  skipExisting: true,      // Skip companies that already have reviews
  minReviewsFilter: 100    // Minimum number of reviews in google (for testing with high-review companies)
};

// Get an Apify token from environment variables or use a fallback for testing
const APIFY_TOKEN = process.env.APIFY_TOKEN || 'apify_api_HZceYJ4kjPoaIyeQb98O8TEYfVqX1w1dOvaq';

// API endpoint
const APIFY_ENDPOINT = `https://api.apify.com/v2/acts/compass~google-maps-reviews-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;

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
 * Fetch reviews for a company using mock data for testing
 * This avoids actual API calls for development
 */
async function fetchReviewsWithMockData(company) {
  console.log(`Generating mock reviews for ${company.name} (${company.place_id})...`);
  
  // Create 5-10 mock reviews
  const reviewCount = Math.floor(Math.random() * 6) + 5;
  const mockReviews = [];
  
  for (let i = 0; i < reviewCount; i++) {
    const mockReview = {
      reviewId: `mock_${company.place_id}_${i}`,
      reviewerName: `Test Reviewer ${i+1}`,
      reviewText: `This is a test review for ${company.name}. It's meant for development purposes only.`,
      stars: Math.floor(Math.random() * 5) + 1,
      publishedAtDate: new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
      reviewerPhotoUrl: null,
      responseFromOwnerText: Math.random() > 0.5 ? `Thank you for your review!` : null,
      responseFromOwnerDate: Math.random() > 0.5 ? new Date().toISOString() : null,
      reviewUrl: `https://maps.google.com/maps?cid=${Math.random()}`
    };
    
    mockReviews.push(mockReview);
  }
  
  console.log(`Generated ${mockReviews.length} mock reviews for ${company.name}`);
  
  return mockReviews;
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
      maxReviews: CONFIG.maxReviewsPerCompany
    };
    
    // Make the API request
    const response = await axios.post(APIFY_ENDPOINT, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 1 minute timeout
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
async function processBatch(companies, existingReviews, useMockData) {
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
    
    // Fetch reviews (either real or mock)
    const reviews = useMockData 
      ? await fetchReviewsWithMockData(company)
      : await fetchReviewsFromApify(company);
    
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
    console.log('Starting Google Reviews fetch (sample)...');
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
    
    // Process companies
    const result = await processBatch(companies, existingReviews, false); // Set to false for real API calls
    
    // Final summary
    console.log('\n=== FINAL SUMMARY ===');
    console.log(`Total companies processed: ${companies.length}`);
    console.log(`Companies with reviews: ${result.companiesWithReviews}`);
    console.log(`Total reviews found: ${result.totalReviews}`);
    console.log(`Reviews added to database: ${result.totalAdded}`);
    console.log(`Reviews skipped (already existed): ${result.totalSkipped}`);
    
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
    
  } catch (err) {
    console.error('Error in main function:', err);
  } finally {
    await pool.end();
    console.log('Database connection closed');
  }
}

// Run the script
main().catch(console.error);