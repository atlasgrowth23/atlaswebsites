// Script to test the Apify Google Maps reviews scraper with a single company
// This will help us understand the response format before creating a 
// more comprehensive solution

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Sample place ID to test with
// In a real scenario, we'd fetch this from the database
const TEST_PLACE_ID = 'ChIJ9U1mz_5YwokR14BDzXivrnY'; // Example: Google NYC office

// Apify endpoint
const APIFY_URL = 'https://api.apify.com/v2/acts/compass~google-maps-reviews-scraper/run-sync-get-dataset-items';
const APIFY_TOKEN = 'apify_api_HZceYJ4kjPoaIyeQb98O8TEYfVqX1w1dOvaq';

async function fetchReviews(placeId) {
  console.log(`Fetching reviews for place ID: ${placeId}`);
  
  try {
    // Prepare request data
    const params = {
      token: APIFY_TOKEN
    };
    
    const data = {
      placeIds: [placeId],
      language: 'en',
      maxItems: 20, // Limit for testing
      reviewsSort: 'newest', // Get the most recent reviews
      includeEmptyReviews: false,
      reviewsLimit: 20 // Limit to 20 reviews for the test
    };
    
    console.log('Sending request to Apify...');
    const response = await axios.post(APIFY_URL, data, { params });
    
    console.log(`Got response with ${response.data.length} reviews`);
    
    // Save the raw response to a file for inspection
    const outputPath = path.join(__dirname, 'apify-response.json');
    fs.writeFileSync(outputPath, JSON.stringify(response.data, null, 2));
    console.log(`Response saved to ${outputPath}`);
    
    // Display some sample data
    if (response.data.length > 0) {
      const place = response.data[0];
      console.log('\nPlace Information:');
      console.log('==================');
      console.log(`Name: ${place.name}`);
      console.log(`Address: ${place.address}`);
      console.log(`Google Rating: ${place.totalScore}`);
      console.log(`Total Reviews: ${place.totalReviewsCount}`);
      
      console.log('\nSample Reviews:');
      console.log('==============');
      
      // Show a few sample reviews
      const reviewsToShow = Math.min(3, place.reviews.length);
      for (let i = 0; i < reviewsToShow; i++) {
        const review = place.reviews[i];
        console.log(`\nReview #${i+1}:`);
        console.log(`Author: ${review.name}`);
        console.log(`Rating: ${review.stars} stars`);
        console.log(`Date: ${review.publishedAtDate}`);
        console.log(`Text: ${review.text.substring(0, 100)}${review.text.length > 100 ? '...' : ''}`);
        
        if (review.responseFromOwnerText) {
          console.log(`Owner Response: ${review.responseFromOwnerText.substring(0, 100)}${review.responseFromOwnerText.length > 100 ? '...' : ''}`);
        }
      }
      
      // Now analyze the response to determine the schema for our database table
      console.log('\nRecommended Review Table Schema:');
      console.log('=============================');
      
      const sampleReview = place.reviews[0];
      const fields = Object.keys(sampleReview);
      
      for (const field of fields) {
        const value = sampleReview[field];
        let type = typeof value;
        
        if (type === 'object') {
          if (value === null) type = 'NULL';
          else if (Array.isArray(value)) type = 'ARRAY';
          else type = 'JSON';
        }
        
        // Map JavaScript types to SQL types
        let sqlType;
        switch (type) {
          case 'string': sqlType = 'TEXT'; break;
          case 'number': 
            sqlType = Number.isInteger(value) ? 'INTEGER' : 'NUMERIC'; 
            break;
          case 'boolean': sqlType = 'BOOLEAN'; break;
          case 'NULL': sqlType = 'TEXT'; break; // Assume TEXT for null values
          case 'ARRAY': sqlType = 'TEXT[]'; break;
          case 'JSON': sqlType = 'JSONB'; break;
          default: sqlType = 'TEXT';
        }
        
        console.log(`${field}: ${sqlType}`);
      }
      
      // Additional fields we should add
      console.log('company_id: INTEGER'); // Foreign key to companies table
      console.log('created_at: TIMESTAMP');
      console.log('updated_at: TIMESTAMP');
    } else {
      console.log('No review data returned from Apify');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching reviews:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

// Run the test
fetchReviews(TEST_PLACE_ID)
  .then(() => console.log('Test completed successfully'))
  .catch(err => console.error('Test failed:', err.message));