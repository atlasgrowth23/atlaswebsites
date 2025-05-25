/**
 * Script to merge Google Maps reviews JSON with company data from database
 * This will add company names and review links to the reviews data
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function query(text, params = []) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('Starting to merge reviews data with company information...');
    
    // Read the original JSON file
    const jsonFilePath = path.join(__dirname, '../public/dataset_Google-Maps-Reviews-Scraper_2025-05-14_17-36-14-844.json');
    console.log('Reading reviews JSON file...');
    const reviewsData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    console.log(`Found ${reviewsData.length} reviews in the JSON file`);
    
    // Get all companies from database with place_id
    console.log('Fetching companies from database...');
    const companiesResult = await query(`
      SELECT place_id, name, location_reviews_link 
      FROM companies 
      WHERE place_id IS NOT NULL AND place_id != ''
    `);
    
    console.log(`Found ${companiesResult.rows.length} companies with place_id in database`);
    
    // Create a lookup map for faster matching
    const companiesMap = new Map();
    companiesResult.rows.forEach(company => {
      companiesMap.set(company.place_id, {
        company_name: company.name,
        reviews_link: company.location_reviews_link
      });
    });
    
    // Merge the data
    console.log('Merging reviews with company data...');
    const mergedData = reviewsData.map(review => {
      const companyData = companiesMap.get(review.placeId);
      return {
        ...review,
        company_name: companyData ? companyData.company_name : null,
        reviews_link: companyData ? companyData.reviews_link : null
      };
    });
    
    // Filter out reviews that have company matches
    const matchedReviews = mergedData.filter(review => review.company_name !== null);
    const unmatchedReviews = mergedData.filter(review => review.company_name === null);
    
    console.log(`Matched ${matchedReviews.length} reviews with companies`);
    console.log(`${unmatchedReviews.length} reviews could not be matched`);
    
    // Save merged JSON file
    const mergedJsonPath = path.join(__dirname, '../public/merged-reviews-with-companies.json');
    fs.writeFileSync(mergedJsonPath, JSON.stringify(mergedData, null, 2));
    console.log(`Saved merged JSON file: ${mergedJsonPath}`);
    
    // Create CSV file
    console.log('Creating CSV file...');
    const csvHeaders = [
      'reviewer_name',
      'company_name', 
      'reviews_link',
      'place_id',
      'stars',
      'review_text',
      'published_date',
      'published_at',
      'latitude',
      'longitude',
      'response_from_owner_date',
      'response_from_owner_text'
    ];
    
    const csvRows = mergedData.map(review => [
      escapeCSV(review.name || ''),
      escapeCSV(review.company_name || ''),
      escapeCSV(review.reviews_link || ''),
      escapeCSV(review.placeId || ''),
      review.stars || '',
      escapeCSV(review.text || ''),
      review.publishedAtDate || '',
      escapeCSV(review.publishAt || ''),
      review.location?.lat || '',
      review.location?.lng || '',
      review.responseFromOwnerDate || '',
      escapeCSV(review.responseFromOwnerText || '')
    ]);
    
    const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
    
    const csvPath = path.join(__dirname, '../public/merged-reviews-with-companies.csv');
    fs.writeFileSync(csvPath, csvContent);
    console.log(`Saved CSV file: ${csvPath}`);
    
    // Summary statistics
    console.log('\n=== SUMMARY ===');
    console.log(`Total reviews processed: ${mergedData.length}`);
    console.log(`Reviews matched with companies: ${matchedReviews.length}`);
    console.log(`Reviews without company match: ${unmatchedReviews.length}`);
    console.log(`Unique companies found: ${new Set(matchedReviews.map(r => r.company_name)).size}`);
    console.log(`Files created:`);
    console.log(`- JSON: merged-reviews-with-companies.json`);
    console.log(`- CSV: merged-reviews-with-companies.csv`);
    
  } catch (error) {
    console.error('Error in main function:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Helper function to escape CSV values
function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  // If the value contains comma, newline, or quote, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return '"' + stringValue.replace(/"/g, '""') + '"';
  }
  return stringValue;
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };