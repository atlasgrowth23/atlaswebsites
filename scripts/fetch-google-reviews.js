const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const { stringify } = require('csv-stringify/sync');

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Create PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Create the reviews table if it doesn't exist
 */
async function ensureReviewsTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS company_reviews (
      id SERIAL PRIMARY KEY,
      review_id TEXT UNIQUE,
      company_id UUID REFERENCES companies(id),
      place_id TEXT,
      reviewer_name TEXT,
      review_text TEXT,
      rating INTEGER,
      published_at TIMESTAMP WITH TIME ZONE,
      reviewer_photo_url TEXT,
      response_from_owner_text TEXT,
      response_from_owner_date TIMESTAMP WITH TIME ZONE,
      review_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  await pool.query(createTableSQL);
  console.log('Ensured reviews table exists');
  
  // Add indexes
  try {
    await pool.query('CREATE INDEX IF NOT EXISTS idx_reviews_company_id ON company_reviews(company_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_reviews_place_id ON company_reviews(place_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_reviews_published_at ON company_reviews(published_at);');
    console.log('Ensured reviews indexes exist');
  } catch (err) {
    console.log('Note: some indexes may already exist');
  }
}

/**
 * Create review stats table to track company review metrics
 */
async function ensureReviewStatsTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS company_review_stats (
      company_id UUID PRIMARY KEY REFERENCES companies(id),
      total_reviews INTEGER DEFAULT 0,
      average_rating DECIMAL(3,2) DEFAULT 0,
      reviews_5_star INTEGER DEFAULT 0,
      reviews_4_star INTEGER DEFAULT 0,
      reviews_3_star INTEGER DEFAULT 0,
      reviews_2_star INTEGER DEFAULT 0,
      reviews_1_star INTEGER DEFAULT 0,
      latest_review_date TIMESTAMP WITH TIME ZONE,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  await pool.query(createTableSQL);
  console.log('Ensured review stats table exists');
}

/**
 * Fetch a company by place_id
 */
async function getCompanyByPlaceId(placeId) {
  const result = await pool.query(
    'SELECT id, name, place_id FROM companies WHERE place_id = $1',
    [placeId]
  );
  
  return result.rows[0];
}

/**
 * Get sample companies with place_ids
 */
async function getSampleCompanies(limit = 10) {
  const result = await pool.query(
    'SELECT id, name, place_id FROM companies WHERE place_id IS NOT NULL LIMIT $1',
    [limit]
  );
  
  return result.rows;
}

/**
 * Fetch Google reviews from the Apify API
 */
async function fetchReviewsFromApify(placeId) {
  try {
    console.log(`Fetching reviews for place_id: ${placeId}`);
    
    const apifyUrl = 'https://api.apify.com/v2/acts/compass~google-maps-reviews-scraper/run-sync-get-dataset-items?token=apify_api_HZceYJ4kjPoaIyeQb98O8TEYfVqX1w1dOvaq';
    
    const response = await axios.post(apifyUrl, {
      placeId: placeId,
      startUrls: [{ url: `https://www.google.com/maps/place/?q=place_id:${placeId}` }],
      language: "en",
      maxReviews: 100,
      dialect: "us"
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Received ${response.data?.length || 0} reviews from Apify API`);
    return response.data || [];
    
  } catch (error) {
    console.error('Error fetching reviews from Apify:', error.message);
    return [];
  }
}

/**
 * Save reviews to the database
 */
async function saveReviews(company, reviews) {
  console.log(`Saving ${reviews.length} reviews for ${company.name}`);
  
  let insertedCount = 0;
  let updatedCount = 0;
  let skipCount = 0;
  
  // Get all existing review IDs for this company to avoid duplicates
  const existingResult = await pool.query(
    'SELECT review_id FROM company_reviews WHERE company_id = $1',
    [company.id]
  );
  
  const existingReviewIds = new Set(existingResult.rows.map(r => r.review_id));
  
  // Process each review
  for (const review of reviews) {
    try {
      // Check if this is a new review
      if (existingReviewIds.has(review.reviewId)) {
        skipCount++;
        continue;
      }
      
      // Insert the review
      await pool.query(`
        INSERT INTO company_reviews (
          review_id, company_id, place_id, reviewer_name, review_text, 
          rating, published_at, reviewer_photo_url, response_from_owner_text,
          response_from_owner_date, review_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (review_id) DO UPDATE SET
          review_text = $5,
          rating = $6,
          response_from_owner_text = $9,
          response_from_owner_date = $10
      `, [
        review.reviewId,
        company.id,
        company.place_id,
        review.reviewerName,
        review.reviewText,
        review.stars,
        new Date(review.publishedAtDate),
        review.reviewerPhotoUrl,
        review.responseFromOwnerText,
        review.responseFromOwnerDate ? new Date(review.responseFromOwnerDate) : null,
        review.reviewUrl
      ]);
      
      insertedCount++;
    } catch (err) {
      console.error(`Error saving review ${review.reviewId}:`, err.message);
    }
  }
  
  console.log(`Reviews saved: ${insertedCount} inserted, ${updatedCount} updated, ${skipCount} skipped`);
  
  // Update company review stats
  await updateCompanyReviewStats(company.id);
}

/**
 * Update review statistics for a company
 */
async function updateCompanyReviewStats(companyId) {
  try {
    // Gather review stats
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_reviews,
        ROUND(AVG(rating)::numeric, 2) as average_rating,
        COUNT(*) FILTER (WHERE rating = 5) as reviews_5_star,
        COUNT(*) FILTER (WHERE rating = 4) as reviews_4_star,
        COUNT(*) FILTER (WHERE rating = 3) as reviews_3_star,
        COUNT(*) FILTER (WHERE rating = 2) as reviews_2_star,
        COUNT(*) FILTER (WHERE rating = 1) as reviews_1_star,
        MAX(published_at) as latest_review_date
      FROM company_reviews
      WHERE company_id = $1
    `, [companyId]);
    
    const stats = statsResult.rows[0];
    
    // Update or insert stats
    await pool.query(`
      INSERT INTO company_review_stats (
        company_id, total_reviews, average_rating, 
        reviews_5_star, reviews_4_star, reviews_3_star, reviews_2_star, reviews_1_star,
        latest_review_date, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (company_id) DO UPDATE SET
        total_reviews = $2,
        average_rating = $3,
        reviews_5_star = $4,
        reviews_4_star = $5,
        reviews_3_star = $6,
        reviews_2_star = $7,
        reviews_1_star = $8,
        latest_review_date = $9,
        updated_at = NOW()
    `, [
      companyId,
      stats.total_reviews,
      stats.average_rating,
      stats.reviews_5_star,
      stats.reviews_4_star,
      stats.reviews_3_star,
      stats.reviews_2_star,
      stats.reviews_1_star,
      stats.latest_review_date
    ]);
    
    console.log(`Updated review stats for company ${companyId}: ${stats.total_reviews} reviews, ${stats.average_rating} avg rating`);
  } catch (err) {
    console.error(`Error updating company review stats:`, err.message);
  }
}

/**
 * Export reviews to CSV
 */
async function exportReviewsToCsv(reviews, company) {
  const csvData = reviews.map(review => ({
    review_id: review.reviewId,
    place_id: company.place_id,
    company_name: company.name,
    reviewer_name: review.reviewerName,
    rating: review.stars,
    review_text: review.reviewText,
    published_at: review.publishedAtDate,
    reviewer_photo: review.reviewerPhotoUrl,
    response_text: review.responseFromOwnerText,
    response_date: review.responseFromOwnerDate,
    review_url: review.reviewUrl
  }));
  
  const csvOutput = stringify(csvData, { header: true });
  
  const safeCompanyName = company.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const csvPath = path.join(process.cwd(), `${safeCompanyName}_reviews.csv`);
  
  fs.writeFileSync(csvPath, csvOutput);
  console.log(`Reviews exported to CSV: ${csvPath}`);
  
  return csvPath;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting Google Reviews fetcher...');
    
    // Ensure database tables exist
    await ensureReviewsTable();
    await ensureReviewStatsTable();
    
    // Option 1: Fetch for a specific place ID
    const specificPlaceId = process.argv[2];
    
    if (specificPlaceId) {
      console.log(`Fetching reviews for specific place_id: ${specificPlaceId}`);
      
      // Get company information
      const company = await getCompanyByPlaceId(specificPlaceId);
      
      if (!company) {
        console.error(`No company found with place_id: ${specificPlaceId}`);
        return;
      }
      
      console.log(`Found company: ${company.name}`);
      
      // Fetch reviews from Apify
      const reviews = await fetchReviewsFromApify(specificPlaceId);
      
      if (reviews.length === 0) {
        console.log('No reviews found for this place_id');
        return;
      }
      
      // Save to database
      await saveReviews(company, reviews);
      
      // Export to CSV
      await exportReviewsToCsv(reviews, company);
      
    } else {
      // Option 2: Fetch for a sample of companies
      console.log('No place_id specified. Fetching a sample of companies...');
      
      const sampleCompanies = await getSampleCompanies(1); // Just fetch 1 for testing
      
      if (sampleCompanies.length === 0) {
        console.log('No companies with place_ids found in database');
        return;
      }
      
      console.log(`Found ${sampleCompanies.length} companies with place_ids`);
      
      // Process first company
      const company = sampleCompanies[0];
      console.log(`Processing sample company: ${company.name} (${company.place_id})`);
      
      const reviews = await fetchReviewsFromApify(company.place_id);
      
      if (reviews.length === 0) {
        console.log('No reviews found for sample company');
        return;
      }
      
      // Save to database
      await saveReviews(company, reviews);
      
      // Export to CSV
      await exportReviewsToCsv(reviews, company);
    }
    
    console.log('Google Reviews fetching complete!');
    
  } catch (err) {
    console.error('Error in main function:', err);
  } finally {
    await pool.end();
  }
}

// Run the main function
main().catch(console.error);