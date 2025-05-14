const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { stringify } = require('csv-stringify/sync');

// Sample place_id from our database
const PLACE_ID = 'ChIJ30uR8VEQiYgRStsQHevIE80'; // Parker And Sons Heating & Cooling Inc

/**
 * Test the Apify Google Maps Reviews API
 */
async function testReviewsApi() {
  try {
    console.log(`Fetching reviews for place_id: ${PLACE_ID}`);
    
    // Apify API endpoint
    const apifyUrl = 'https://api.apify.com/v2/acts/compass~google-maps-reviews-scraper/run-sync-get-dataset-items?token=apify_api_HZceYJ4kjPoaIyeQb98O8TEYfVqX1w1dOvaq';
    
    // API request body
    const requestBody = {
      placeId: PLACE_ID,
      startUrls: [{ url: `https://www.google.com/maps/place/?q=place_id:${PLACE_ID}` }],
      language: "en",
      maxReviews: 20, // Limit for testing
      dialect: "us"
    };
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    // Make the API request
    const response = await axios.post(apifyUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Check the response
    console.log(`API response status: ${response.status}`);
    
    // 201 status is actually successful (Created)
    if (response.status !== 200 && response.status !== 201) {
      console.error(`API request failed with status: ${response.status}`);
      return;
    }
    
    const data = response.data;
    
    // Log response headers for debugging
    console.log('Response headers:', JSON.stringify(response.headers, null, 2));
    // Log complete response for debugging
    console.log('Full response data:', JSON.stringify(response.data, null, 2));
    
    // Save the raw response for analysis
    const rawResponsePath = path.join(process.cwd(), 'apify-response.json');
    fs.writeFileSync(rawResponsePath, JSON.stringify(data, null, 2));
    console.log(`Raw API response saved to: ${rawResponsePath}`);
    
    // Handle data that might be nested or in different format
    let reviews = [];
    if (Array.isArray(data)) {
      reviews = data;
      console.log(`Received ${reviews.length} reviews directly in array`);
    } else if (data && typeof data === 'object') {
      // Check common response formats
      if (data.items && Array.isArray(data.items)) {
        reviews = data.items;
        console.log(`Received ${reviews.length} reviews in data.items array`);
      } else if (data.results && Array.isArray(data.results)) {
        reviews = data.results;
        console.log(`Received ${reviews.length} reviews in data.results array`);
      } else if (data.data && Array.isArray(data.data)) {
        reviews = data.data;
        console.log(`Received ${reviews.length} reviews in data.data array`);
      } else {
        console.log('Could not find reviews array in response. See raw data for structure.');
        return;
      }
    } else {
      console.log('Response is not an array or object. See raw data for structure.');
      return;
    }
    
    // If we have reviews, export to CSV for analysis
    if (reviews && reviews.length > 0) {
      // Examine the first review to understand structure
      console.log('\nSample review structure:');
      const sampleReview = reviews[0];
      
      // Print all fields in the sample review
      Object.keys(sampleReview).forEach(key => {
        const value = sampleReview[key];
        console.log(`${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
      });
      
      // Create CSV for analysis
      const csvData = reviews.map(review => ({
        review_id: review.reviewId || '',
        reviewer_name: review.reviewerName || '',
        rating: review.stars || '',
        review_text: review.reviewText || '',
        published_at: review.publishedAtDate || '',
        reviewer_photo: review.reviewerPhotoUrl || '',
        response_text: review.responseFromOwnerText || '',
        response_date: review.responseFromOwnerDate || '',
        review_url: review.reviewUrl || ''
      }));
      
      const csvOutput = stringify(csvData, { header: true });
      const csvPath = path.join(process.cwd(), 'sample-reviews.csv');
      fs.writeFileSync(csvPath, csvOutput);
      console.log(`\nReviews exported to CSV: ${csvPath}`);
      
      // Provide database schema recommendation
      console.log('\nRecommended database schema based on API response:');
      console.log(`
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

CREATE INDEX idx_reviews_company_id ON company_reviews(company_id);
CREATE INDEX idx_reviews_place_id ON company_reviews(place_id);
CREATE INDEX idx_reviews_published_at ON company_reviews(published_at);

-- Review statistics table for quick metrics
CREATE TABLE company_review_stats (
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
      `);
    }
    
  } catch (error) {
    console.error('Error fetching reviews from Apify:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testReviewsApi().catch(console.error);