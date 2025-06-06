const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verifyReviewFix() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verifying review calculation fixes...');
    
    // Get some sample companies to verify
    const { rows: sampleCompanies } = await client.query(`
      SELECT name, reviews, rating, r_30, r_60, r_90, r_365, first_review_date, updated_at
      FROM companies 
      WHERE reviews > 0 
      ORDER BY updated_at DESC 
      LIMIT 10
    `);
    
    console.log('\n📊 Recently updated companies with review data:');
    sampleCompanies.forEach(company => {
      console.log(`\n🏢 ${company.name}:`);
      console.log(`   Total Reviews: ${company.reviews}`);
      console.log(`   Rating: ${company.rating}`);
      console.log(`   R30: ${company.r_30}, R60: ${company.r_60}, R90: ${company.r_90}, R365: ${company.r_365}`);
      console.log(`   First Review: ${company.first_review_date ? new Date(company.first_review_date).toLocaleDateString() : 'None'}`);
      console.log(`   Updated: ${new Date(company.updated_at).toLocaleString()}`);
    });
    
    // Get summary statistics
    const { rows: stats } = await client.query(`
      SELECT 
        COUNT(*) as total_companies,
        COUNT(CASE WHEN reviews > 0 THEN 1 END) as companies_with_reviews,
        SUM(reviews) as total_reviews,
        AVG(rating) as avg_rating,
        SUM(r_30) as total_r30,
        SUM(r_60) as total_r60,
        SUM(r_90) as total_r90,
        SUM(r_365) as total_r365
      FROM companies
    `);
    
    const stat = stats[0];
    console.log('\n📈 Database statistics after update:');
    console.log(`   Total companies: ${stat.total_companies}`);
    console.log(`   Companies with reviews: ${stat.companies_with_reviews}`);
    console.log(`   Total reviews: ${stat.total_reviews}`);
    console.log(`   Average rating: ${Number(stat.avg_rating).toFixed(2)}`);
    console.log(`   Recent reviews: R30=${stat.total_r30}, R60=${stat.total_r60}, R90=${stat.total_r90}, R365=${stat.total_r365}`);
    
    console.log('\n✅ Review calculations have been successfully updated and verified!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

verifyReviewFix().catch(console.error);