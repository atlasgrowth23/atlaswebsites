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
 * View reviews for a specific company
 */
async function viewCompanyReviews() {
  try {
    // Get command line arguments - company ID
    const companyId = process.argv[2];
    
    if (!companyId) {
      console.error('Please provide a company ID as an argument');
      console.log('Usage: node scripts/view-company-reviews.js <company_id>');
      
      // List top companies with reviews
      console.log('\nTop companies with reviews:');
      const topCompaniesResult = await query(`
        SELECT c.name, c.id, COUNT(cr.id) as review_count
        FROM companies c
        JOIN company_reviews cr ON c.id = cr.company_id
        GROUP BY c.id, c.name
        ORDER BY review_count DESC
        LIMIT 10
      `);
      
      topCompaniesResult.rows.forEach((company, index) => {
        console.log(`${index + 1}. ${company.name} (ID: ${company.id}): ${company.review_count} reviews`);
      });
      
      await pool.end();
      return;
    }
    
    // Get company information
    const companyResult = await query('SELECT * FROM companies WHERE id = $1', [companyId]);
    if (companyResult.rows.length === 0) {
      console.error(`Company with ID ${companyId} not found`);
      await pool.end();
      return;
    }
    
    const company = companyResult.rows[0];
    console.log(`Company: ${company.name}`);
    console.log(`Location: ${company.city}, ${company.state}`);
    console.log(`Website: ${company.site || 'N/A'}`);
    console.log(`Place ID: ${company.place_id || 'N/A'}`);
    
    // Get review statistics
    const reviewStatsResult = await query(`
      SELECT 
        COUNT(*) as total_reviews,
        MIN(rating) as min_rating,
        MAX(rating) as max_rating,
        AVG(rating) as avg_rating,
        COUNT(*) FILTER (WHERE rating = 5) as five_star_count,
        COUNT(*) FILTER (WHERE rating = 4) as four_star_count,
        COUNT(*) FILTER (WHERE rating = 3) as three_star_count,
        COUNT(*) FILTER (WHERE rating = 2) as two_star_count,
        COUNT(*) FILTER (WHERE rating = 1) as one_star_count
      FROM company_reviews
      WHERE company_id = $1
    `, [companyId]);
    
    if (reviewStatsResult.rows.length > 0) {
      const stats = reviewStatsResult.rows[0];
      console.log('\nReview Statistics:');
      console.log(`Total Reviews: ${stats.total_reviews}`);
      console.log(`Average Rating: ${parseFloat(stats.avg_rating).toFixed(2)} out of 5`);
      
      if (stats.total_reviews > 0) {
        const starDistribution = [
          { stars: 5, count: parseInt(stats.five_star_count) },
          { stars: 4, count: parseInt(stats.four_star_count) },
          { stars: 3, count: parseInt(stats.three_star_count) },
          { stars: 2, count: parseInt(stats.two_star_count) },
          { stars: 1, count: parseInt(stats.one_star_count) }
        ];
        
        console.log('\nStar Distribution:');
        starDistribution.forEach(item => {
          const percentage = (item.count / stats.total_reviews * 100).toFixed(1);
          const bar = '*'.repeat(Math.floor(percentage / 5));
          console.log(`${item.stars} stars: ${item.count} (${percentage}%) ${bar}`);
        });
      }
    }
    
    // Get recent reviews
    const recentReviewsResult = await query(`
      SELECT 
        review_id,
        reviewer_name,
        rating,
        text,
        published_at,
        response_from_owner_text
      FROM company_reviews
      WHERE company_id = $1
      ORDER BY published_at DESC
      LIMIT 5
    `, [companyId]);
    
    if (recentReviewsResult.rows.length > 0) {
      console.log('\nRecent Reviews:');
      recentReviewsResult.rows.forEach((review, index) => {
        const date = review.published_at ? new Date(review.published_at).toLocaleDateString() : 'Unknown date';
        console.log(`\n${index + 1}. Rating: ${review.rating}/5 - ${date} - ${review.reviewer_name || 'Anonymous'}`);
        console.log(`${review.text || '(No text)'}`);
        
        if (review.response_from_owner_text) {
          console.log(`\nOwner's response: ${review.response_from_owner_text}`);
        }
      });
    } else {
      console.log('\nNo reviews found for this company.');
    }
    
    // Close the database connection
    await pool.end();
    
  } catch (error) {
    console.error('Error viewing company reviews:', error.message);
    // Ensure the pool is closed even on error
    if (pool) await pool.end();
    process.exit(1);
  }
}

// Run the function
viewCompanyReviews().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});