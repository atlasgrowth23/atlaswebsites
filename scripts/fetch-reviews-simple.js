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

// Configuration
const CONFIG = {
  batchSize: 1,             // Process just one company at a time to avoid timeouts
  maxReviewsPerCompany: 10, // Even fewer reviews to ensure completion
  delayBetweenBatches: 5000, // Delay between batches in ms (give more time)
  limitCompanies: 1,        // Let's just try ONE company first
  startFromCompanyIndex: 0, // Start from the first company
  minRating: 3,             // Be more lenient with ratings
  specificPlaceId: "ChIJxXU6BAQbmogRymFNU-LVXPc" // Wayne's Comfort Services
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
 * Get companies with place_ids for review fetching
 */
async function getCompaniesForReviews() {
  try {
    // Check if we should get a specific company by place_id
    if (CONFIG.specificPlaceId) {
      console.log(`Fetching specific company with place_id: ${CONFIG.specificPlaceId}`);
      const result = await query(`
        SELECT id, name, place_id, reviews as review_count
        FROM companies
        WHERE place_id = $1
      `, [CONFIG.specificPlaceId]);
      
      // If found, return just that company
      if (result.rows.length > 0) {
        return result.rows;
      }
      
      console.log(`Company with place_id ${CONFIG.specificPlaceId} not found, falling back to regular query`);
    }
    
    // Get top companies by review count (regular method)
    console.log(`Fetching top ${CONFIG.limitCompanies} companies by review count`);
    const result = await query(`
      SELECT id, name, place_id, reviews as review_count
      FROM companies
      WHERE place_id IS NOT NULL AND place_id != ''
        AND reviews > 100
      ORDER BY reviews DESC
      LIMIT $1
      OFFSET $2
    `, [CONFIG.limitCompanies, CONFIG.startFromCompanyIndex]);
    
    return result.rows;
  } catch (err) {
    console.error('Error getting companies:', err.message);
    return [];
  }
}

/**
 * Fetch reviews for a single company using Apify
 */
async function fetchReviewsForCompany(company) {
  console.log(`\nFetching reviews for ${company.name} (${company.place_id})...`);
  
  try {
    // Create a simpler approach - use the single call endpoint
    console.log(`Using Apify run-sync-get-dataset-items endpoint for ${company.name}...`);
    
    const requestBody = {
      placeId: company.place_id,
      maxReviews: CONFIG.maxReviewsPerCompany,
      language: "en",
      reviewer: "all"
    };

    // Write request to a file for debugging
    fs.writeFileSync(
      `${company.name.replace(/[^a-z0-9]/gi, '_')}_request.json`,
      JSON.stringify(requestBody, null, 2)
    );
    
    console.log('Request body:', JSON.stringify(requestBody));
    
    // Make a direct call to the Apify endpoint that returns reviews
    const response = await axios.post(
      `https://api.apify.com/v2/acts/compass~google-maps-reviews-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
      requestBody,
      { 
        headers: { 'Content-Type': 'application/json' },
        timeout: 180000 // 3-minute timeout
      }
    );
    
    // Save the raw response to file for debugging
    fs.writeFileSync(
      `${company.name.replace(/[^a-z0-9]/gi, '_')}_response.json`,
      JSON.stringify(response.data, null, 2)
    );
    
    console.log(`API response status: ${response.status}`);
    
    // Check if we got a valid response
    if (!response.data || !Array.isArray(response.data)) {
      console.error('Invalid response format from Apify:', typeof response.data);
      return [];
    }
    
    console.log(`Retrieved ${response.data.length} reviews for ${company.name}`);
    
    // Filter reviews by rating
    const reviews = response.data.filter(item => 
      item.stars && item.stars >= CONFIG.minRating
    );
    
    console.log(`After filtering (rating >= ${CONFIG.minRating}): ${reviews.length} reviews`);
    
    return reviews;
    
  } catch (err) {
    console.error(`Error fetching reviews for ${company.name}:`, err.message);
    
    // Save error details for debugging
    fs.writeFileSync(
      `${company.name.replace(/[^a-z0-9]/gi, '_')}_error.txt`,
      `Error: ${err.message}\n\nStack: ${err.stack}`
    );
    
    return [];
  }
}

/**
 * Save reviews to the database
 */
async function saveReviewsToDatabase(company, reviews) {
  if (!reviews.length) {
    console.log(`No reviews to save for ${company.name}`);
    return { added: 0 };
  }
  
  console.log(`Saving ${reviews.length} reviews for ${company.name}...`);
  let added = 0;
  
  for (const review of reviews) {
    try {
      // Build a unique review ID if not provided
      const reviewId = review.reviewId || 
                     `${company.place_id}_${review.reviewerId || ''}_${Date.parse(review.publishedAtDate) || ''}`;
      
      // Insert the review
      await query(`
        INSERT INTO company_reviews (
          review_id, company_id, place_id, 
          reviewer_name, review_text,
          rating, published_at, reviewer_photo_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (review_id) DO NOTHING
      `, [
        reviewId,
        company.id,
        company.place_id,
        review.reviewerName || '',
        review.reviewText || '',
        review.stars || 5,
        review.publishedAtDate ? new Date(review.publishedAtDate) : new Date(),
        review.reviewerPhotoUrl || ''
      ]);
      
      added++;
    } catch (err) {
      console.error(`Error saving review:`, err.message);
    }
  }
  
  console.log(`Successfully saved ${added} reviews for ${company.name}`);
  return { added };
}

/**
 * Update review stats for a company
 */
async function updateReviewStats(companyId, placeId) {
  try {
    // Get aggregate stats
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_reviews,
        ROUND(AVG(rating)::numeric, 2) as average_rating,
        COUNT(*) FILTER (WHERE rating = 5) as rating_5_count,
        COUNT(*) FILTER (WHERE rating = 4) as rating_4_count,
        COUNT(*) FILTER (WHERE rating = 3) as rating_3_count,
        COUNT(*) FILTER (WHERE rating = 2) as rating_2_count,
        COUNT(*) FILTER (WHERE rating = 1) as rating_1_count,
        MAX(published_at) as last_review_date
      FROM company_reviews
      WHERE place_id = $1
    `, [placeId]);
    
    if (!statsResult.rows.length) {
      return;
    }
    
    const stats = statsResult.rows[0];
    
    // Update the stats table
    await query(`
      INSERT INTO company_review_stats (
        place_id, company_id, total_reviews, average_rating,
        rating_5_count, rating_4_count, rating_3_count, 
        rating_2_count, rating_1_count,
        last_review_date, last_updated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      ON CONFLICT (place_id) DO UPDATE SET
        total_reviews = EXCLUDED.total_reviews,
        average_rating = EXCLUDED.average_rating,
        rating_5_count = EXCLUDED.rating_5_count,
        rating_4_count = EXCLUDED.rating_4_count,
        rating_3_count = EXCLUDED.rating_3_count,
        rating_2_count = EXCLUDED.rating_2_count,
        rating_1_count = EXCLUDED.rating_1_count,
        last_review_date = EXCLUDED.last_review_date,
        last_updated = NOW()
    `, [
      placeId,
      companyId,
      stats.total_reviews,
      stats.average_rating,
      stats.rating_5_count,
      stats.rating_4_count,
      stats.rating_3_count,
      stats.rating_2_count,
      stats.rating_1_count,
      stats.last_review_date
    ]);
    
    console.log(`Updated review stats for ${companyId}: ${stats.total_reviews} reviews, avg ${stats.average_rating}`);
  } catch (err) {
    console.error(`Error updating review stats:`, err.message);
  }
}

/**
 * Process companies one by one
 */
async function processCompanies(companies) {
  console.log(`Processing ${companies.length} companies...`);
  
  let totalReviews = 0;
  
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    console.log(`\n--- Processing company ${i + 1}/${companies.length}: ${company.name} ---`);
    
    // 1. Fetch reviews
    const reviews = await fetchReviewsForCompany(company);
    
    // 2. Save to database
    const saveResult = await saveReviewsToDatabase(company, reviews);
    totalReviews += saveResult.added;
    
    // 3. Update stats
    await updateReviewStats(company.id, company.place_id);
    
    // Add delay between companies
    if (i < companies.length - 1) {
      console.log(`Waiting ${CONFIG.delayBetweenBatches}ms before next company...`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenBatches));
    }
  }
  
  return totalReviews;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting simple review fetch script...');
    console.log('Configuration:', CONFIG);
    
    // Get companies to process
    const companies = await getCompaniesForReviews();
    
    if (!companies.length) {
      console.log('No companies found to process');
      return;
    }
    
    console.log(`Found ${companies.length} companies to process`);
    
    // Process the companies
    const totalReviews = await processCompanies(companies);
    
    // Show final summary
    console.log('\n=== FINAL SUMMARY ===');
    console.log(`Companies processed: ${companies.length}`);
    console.log(`Total reviews added: ${totalReviews}`);
    
    // Check what we have in the database now
    const countResult = await query('SELECT COUNT(*) FROM company_reviews');
    console.log(`Total reviews in database: ${countResult.rows[0].count}`);
    
  } catch (err) {
    console.error('Error in main function:', err);
  } finally {
    await pool.end();
    console.log('\nDatabase connection closed');
  }
}

// Run the script
main().catch(console.error);