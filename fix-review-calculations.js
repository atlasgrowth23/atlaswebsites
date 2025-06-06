const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixReviewCalculations() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Analyzing review data and fixing calculations...');
    
    // Load review data
    console.log('📖 Loading review data from JSON...');
    const reviewData = JSON.parse(fs.readFileSync('/workspaces/atlaswebsites/public/merged-reviews-with-companies.json', 'utf8'));
    console.log(`📊 Found ${reviewData.length} reviews total`);
    
    // Current date for calculations
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));
    const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
    const threeGuySixtyFiveDaysAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
    
    console.log(`📅 Current date: ${now.toISOString()}`);
    console.log(`📅 30 days ago: ${thirtyDaysAgo.toISOString()}`);
    console.log(`📅 365 days ago: ${threeGuySixtyFiveDaysAgo.toISOString()}`);
    
    // Group reviews by company
    const reviewsByCompany = {};
    let validReviews = 0;
    let invalidDates = 0;
    
    reviewData.forEach(review => {
      const companyName = review.company_name;
      if (!companyName) return;
      
      // Parse review date
      let reviewDate;
      try {
        reviewDate = new Date(review.publishedAtDate);
        // Check if date is valid and not in the future (with some tolerance)
        const futureLimit = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // 1 week in future
        if (isNaN(reviewDate.getTime()) || reviewDate > futureLimit) {
          console.log(`⚠️  Invalid date for ${companyName}: ${review.publishedAtDate}`);
          invalidDates++;
          return;
        }
        validReviews++;
      } catch (error) {
        invalidDates++;
        return;
      }
      
      if (!reviewsByCompany[companyName]) {
        reviewsByCompany[companyName] = [];
      }
      
      reviewsByCompany[companyName].push({
        date: reviewDate,
        stars: review.stars || 0
      });
    });
    
    console.log(`✅ Valid reviews: ${validReviews}`);
    console.log(`❌ Invalid dates: ${invalidDates}`);
    console.log(`🏢 Companies with reviews: ${Object.keys(reviewsByCompany).length}`);
    
    // Calculate metrics for each company
    const companyMetrics = {};
    
    Object.keys(reviewsByCompany).forEach(companyName => {
      const reviews = reviewsByCompany[companyName];
      
      // Sort reviews by date (newest first)
      reviews.sort((a, b) => b.date - a.date);
      
      const r30 = reviews.filter(r => r.date >= thirtyDaysAgo).length;
      const r60 = reviews.filter(r => r.date >= sixtyDaysAgo).length;
      const r90 = reviews.filter(r => r.date >= ninetyDaysAgo).length;
      const r365 = reviews.filter(r => r.date >= threeGuySixtyFiveDaysAgo).length;
      
      const totalReviews = reviews.length;
      const avgRating = totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.stars, 0) / totalReviews : 0;
      const firstReviewDate = reviews.length > 0 ? reviews[reviews.length - 1].date : null;
      
      companyMetrics[companyName] = {
        r30,
        r60, 
        r90,
        r365,
        total: totalReviews,
        rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal place
        first_review_date: firstReviewDate ? firstReviewDate.toISOString() : null
      };
    });
    
    // Show sample of what we calculated
    console.log('\n📊 Sample calculations:');
    Object.keys(companyMetrics).slice(0, 5).forEach(company => {
      const metrics = companyMetrics[company];
      console.log(`\n🏢 ${company}:`);
      console.log(`   Total Reviews: ${metrics.total}`);
      console.log(`   Rating: ${metrics.rating}`);
      console.log(`   R30: ${metrics.r30}, R60: ${metrics.r60}, R90: ${metrics.r90}, R365: ${metrics.r365}`);
      console.log(`   First Review: ${metrics.first_review_date ? new Date(metrics.first_review_date).toLocaleDateString() : 'None'}`);
    });
    
    // Check current database values for all companies with reviews
    console.log('\n🔍 Checking current database values...');
    const { rows: currentCompanies } = await client.query(`
      SELECT name, reviews, rating, r_30, r_60, r_90, r_365, first_review_date 
      FROM companies 
      WHERE name = ANY($1)
      ORDER BY name
    `, [Object.keys(companyMetrics)]);
    
    console.log('\n📋 Analyzing differences...');
    let correctCount = 0;
    let needsUpdateCount = 0;
    const updateSummary = [];
    
    currentCompanies.forEach(company => {
      const calculated = companyMetrics[company.name];
      if (calculated) {
        const dbR30 = company.r_30 || 0;
        const dbR60 = company.r_60 || 0;
        const dbR90 = company.r_90 || 0;
        const dbR365 = company.r_365 || 0;
        const dbTotal = company.reviews || 0;
        const dbRating = company.rating || 0;
        
        const needsUpdate = (
          dbR30 !== calculated.r30 ||
          dbR60 !== calculated.r60 ||
          dbR90 !== calculated.r90 ||
          dbR365 !== calculated.r365 ||
          dbTotal !== calculated.total ||
          Math.abs(dbRating - calculated.rating) > 0.1
        );
        
        if (needsUpdate) {
          needsUpdateCount++;
          updateSummary.push({
            name: company.name,
            differences: {
              total: dbTotal !== calculated.total ? `${dbTotal}→${calculated.total}` : null,
              rating: Math.abs(dbRating - calculated.rating) > 0.1 ? `${dbRating}→${calculated.rating}` : null,
              r30: dbR30 !== calculated.r30 ? `${dbR30}→${calculated.r30}` : null,
              r60: dbR60 !== calculated.r60 ? `${dbR60}→${calculated.r60}` : null,
              r90: dbR90 !== calculated.r90 ? `${dbR90}→${calculated.r90}` : null,
              r365: dbR365 !== calculated.r365 ? `${dbR365}→${calculated.r365}` : null
            }
          });
        } else {
          correctCount++;
        }
      }
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Correct companies: ${correctCount}`);
    console.log(`   ❌ Companies needing updates: ${needsUpdateCount}`);
    console.log(`   📈 Total companies analyzed: ${currentCompanies.length}`);
    
    if (updateSummary.length > 0) {
      console.log(`\n🔧 Companies that need updates (showing first 10):`);
      updateSummary.slice(0, 10).forEach(item => {
        console.log(`\n🏢 ${item.name}:`);
        Object.entries(item.differences).forEach(([key, change]) => {
          if (change) console.log(`   ${key}: ${change}`);
        });
      });
    }
    
    // Ask user if they want to update
    console.log('\n❓ Do you want to update the database with calculated values? (This is a DRY RUN)');
    console.log('📝 To actually update, set UPDATE_DATABASE=true in the script');
    
    const UPDATE_DATABASE = true; // Set to true to actually update
    
    if (UPDATE_DATABASE) {
      console.log('\n🚀 Updating database...');
      let updateCount = 0;
      
      for (const [companyName, metrics] of Object.entries(companyMetrics)) {
        try {
          const { rowCount } = await client.query(`
            UPDATE companies 
            SET 
              reviews = $1,
              rating = $2,
              r_30 = $3,
              r_60 = $4,
              r_90 = $5,
              r_365 = $6,
              first_review_date = $7,
              updated_at = NOW()
            WHERE name = $8
          `, [
            metrics.total,
            metrics.rating,
            metrics.r30,
            metrics.r60,
            metrics.r90,
            metrics.r365,
            metrics.first_review_date,
            companyName
          ]);
          
          if (rowCount > 0) {
            updateCount++;
          }
        } catch (error) {
          console.error(`❌ Error updating ${companyName}:`, error.message);
        }
      }
      
      console.log(`✅ Updated ${updateCount} companies`);
    } else {
      console.log('🔍 DRY RUN: No database changes made');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixReviewCalculations().catch(console.error);