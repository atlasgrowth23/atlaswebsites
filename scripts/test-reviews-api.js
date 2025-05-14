const axios = require('axios');

// Apify API token
const APIFY_TOKEN = 'apify_api_HZceYJ4kjPoaIyeQb98O8TEYfVqX1w1dOvaq';

// API endpoint
const APIFY_ENDPOINT = `https://api.apify.com/v2/acts/compass~google-maps-reviews-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;

// Sample place ID
const PLACE_ID = 'ChIJg_hYEBldYogRSqGUVKHAzmU'; // Vandy's Heating & Air Conditioning

async function main() {
  try {
    console.log('Testing Google Reviews API endpoint...');
    
    // Prepare the API request
    const requestBody = {
      placeId: PLACE_ID,
      startUrls: [{ url: `https://www.google.com/maps/place/?q=place_id:${PLACE_ID}` }],
      language: "en",
      dialect: "us",
      maxReviews: 5 // Limit to 5 for quick testing
    };
    
    console.log('Request body:', JSON.stringify(requestBody));
    console.log('Sending request to:', APIFY_ENDPOINT);
    
    // Make the API request
    const startTime = Date.now();
    console.log('Request started at:', new Date(startTime).toISOString());
    
    const response = await axios.post(APIFY_ENDPOINT, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 second timeout
    });
    
    const endTime = Date.now();
    console.log('Request completed in:', (endTime - startTime) / 1000, 'seconds');
    
    // Check for valid response
    console.log('Response status:', response.status);
    
    // Handle the response data
    const data = response.data;
    
    // Check response type
    console.log('Response type:', typeof data);
    console.log('Is array:', Array.isArray(data));
    
    if (Array.isArray(data)) {
      console.log('Number of reviews:', data.length);
      if (data.length > 0) {
        console.log('First review:', JSON.stringify(data[0], null, 2));
      }
    } else if (data && typeof data === 'object') {
      console.log('Response object keys:', Object.keys(data));
      
      let reviews = [];
      if (data.items && Array.isArray(data.items)) {
        reviews = data.items;
      } else if (data.results && Array.isArray(data.results)) {
        reviews = data.results;
      } else if (data.data && Array.isArray(data.data)) {
        reviews = data.data;
      }
      
      console.log('Extracted reviews count:', reviews.length);
      if (reviews.length > 0) {
        console.log('First review:', JSON.stringify(reviews[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('Error testing API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data));
    }
  }
}

// Run the script
main().catch(console.error);