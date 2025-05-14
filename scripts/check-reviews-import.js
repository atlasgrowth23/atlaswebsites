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
 * Check the status of the company_reviews table
 */
async function checkReviewsImport() {
  try {
    console.log('Checking company_reviews table...');
    
    // Check how many reviews have been imported
    const reviewsResult = await query('SELECT COUNT(*) FROM company_reviews');
    const reviewsCount = parseInt(reviewsResult.rows[0].count);
    
    console.log(`Total reviews imported: ${reviewsCount}`);
    
    // Check how many companies have reviews
    const companiesWithReviewsResult = await query(`
      SELECT COUNT(DISTINCT company_id) FROM company_reviews
    `);
    const companiesWithReviewsCount = parseInt(companiesWithReviewsResult.rows[0].count);
    
    console.log(`Companies with reviews: ${companiesWithReviewsCount}`);
    
    // Get sample of companies with most reviews
    const topCompaniesResult = await query(`
      SELECT c.name, c.id, c.place_id, COUNT(cr.id) as review_count
      FROM companies c
      JOIN company_reviews cr ON c.id = cr.company_id
      GROUP BY c.id, c.name, c.place_id
      ORDER BY review_count DESC
      LIMIT 10
    `);
    
    console.log('\nTop 10 companies by review count:');
    topCompaniesResult.rows.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name} (ID: ${company.id}): ${company.review_count} reviews`);
    });
    
    // Get review statistics
    const reviewStatsResult = await query(`
      SELECT 
        MIN(rating) as min_rating,
        MAX(rating) as max_rating,
        AVG(rating) as avg_rating,
        COUNT(*) FILTER (WHERE rating = 5) as five_star_count,
        COUNT(*) FILTER (WHERE rating = 4) as four_star_count,
        COUNT(*) FILTER (WHERE rating = 3) as three_star_count,
        COUNT(*) FILTER (WHERE rating = 2) as two_star_count,
        COUNT(*) FILTER (WHERE rating = 1) as one_star_count
      FROM company_reviews
    `);
    
    if (reviewStatsResult.rows.length > 0) {
      const stats = reviewStatsResult.rows[0];
      console.log('\nReview Rating Statistics:');
      console.log(`- Average Rating: ${parseFloat(stats.avg_rating).toFixed(2)}`);
      console.log(`- 5-Star Reviews: ${stats.five_star_count}`);
      console.log(`- 4-Star Reviews: ${stats.four_star_count}`);
      console.log(`- 3-Star Reviews: ${stats.three_star_count}`);
      console.log(`- 2-Star Reviews: ${stats.two_star_count}`);
      console.log(`- 1-Star Reviews: ${stats.one_star_count}`);
    }
    
    // Close the database connection
    await pool.end();
    
  } catch (error) {
    console.error('Error checking review import:', error.message);
    process.exit(1);
  }
}

// Run the check function
checkReviewsImport().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});