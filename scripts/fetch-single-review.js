const axios = require('axios');
const fs = require('fs');

// The specific place ID to fetch
const PLACE_ID = 'ChIJxXU6BAQbmogRymFNU-LVXPc'; // Wayne's Comfort Services
const MAX_REVIEWS = 10;
const APIFY_TOKEN = 'apify_api_HZceYJ4kjPoaIyeQb98O8TEYfVqX1w1dOvaq';

/**
 * Main function to fetch reviews for a single place
 */
async function fetchReviews() {
  console.log(`Fetching up to ${MAX_REVIEWS} reviews for place ID: ${PLACE_ID}`);
  
  try {
    // Try an alternative approach - create a task first
    console.log('Step 1: Creating an Apify task...');
    
    // Build request body for creating a run
    const requestBody = {
      "startUrls": [
        { "url": `https://www.google.com/maps/place/?q=place_id:${PLACE_ID}` }
      ],
      "maxReviews": MAX_REVIEWS,
      "language": "en",
      "includeImages": false
    };
    
    console.log('Request payload:', JSON.stringify(requestBody, null, 2));
    
    // First check if we have any credit to run the task
    console.log('Checking Apify user info...');
    const userResponse = await axios.get(
      `https://api.apify.com/v2/users/me?token=${APIFY_TOKEN}`
    );
    
    console.log('User info response status:', userResponse.status);
    console.log('User info:', JSON.stringify(userResponse.data, null, 2));
    
    // Create a run with the actor directly
    console.log('Creating a run with shu03/google-maps-reviews-scraper actor...');
    const runResponse = await axios.post(
      `https://api.apify.com/v2/acts/shu03~google-maps-reviews-scraper/runs?token=${APIFY_TOKEN}`,
      requestBody,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000 // 30 second timeout for run creation
      }
    );
    
    console.log('Run created with status:', runResponse.status);
    console.log('Run data:', JSON.stringify(runResponse.data, null, 2));
    
    const runId = runResponse.data.id;
    console.log(`Run ID: ${runId}`);
    
    // Wait for the run to finish
    console.log('Waiting for run to complete (this may take a while)...');
    let isFinished = false;
    let attempts = 0;
    let runDetail;
    
    while (!isFinished && attempts < 12) { // Max 2 minutes (12 * 10 seconds)
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      const detailResponse = await axios.get(
        `https://api.apify.com/v2/acts/shu03~google-maps-reviews-scraper/runs/${runId}?token=${APIFY_TOKEN}`
      );
      
      runDetail = detailResponse.data;
      console.log(`Status check ${attempts}: ${runDetail.status}`);
      
      if (['SUCCEEDED', 'FAILED', 'TIMED-OUT', 'ABORTED'].includes(runDetail.status)) {
        isFinished = true;
      }
    }
    
    if (!isFinished) {
      throw new Error('Run timed out waiting for completion');
    }
    
    if (runDetail.status !== 'SUCCEEDED') {
      throw new Error(`Run failed with status: ${runDetail.status}`);
    }
    
    // Get the dataset items
    console.log('Fetching dataset items...');
    const datasetId = runDetail.defaultDatasetId;
    const datasetResponse = await axios.get(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`
    );
    
    console.log('Dataset response status:', datasetResponse.status);
    
    // Save full response to file
    fs.writeFileSync(
      `place_id_${PLACE_ID}_reviews.json`, 
      JSON.stringify(datasetResponse.data, null, 2)
    );
    
    // Print some basic stats
    if (Array.isArray(datasetResponse.data)) {
      console.log(`Got ${datasetResponse.data.length} reviews`);
      
      // Show summary of first few reviews
      datasetResponse.data.slice(0, 3).forEach((review, i) => {
        console.log(`\nReview ${i + 1}:`);
        console.log(`Rating: ${review.stars || review.rating || 'N/A'}`);
        console.log(`Reviewer: ${review.reviewerName || review.author_name || 'Anonymous'}`);
        const text = review.reviewText || review.text || '';
        console.log(`Text: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
      });
    } else {
      console.log('Response is not an array. Type:', typeof datasetResponse.data);
      console.log('Response preview:', JSON.stringify(datasetResponse.data).substring(0, 200) + '...');
    }
    
  } catch (err) {
    console.error('Error fetching reviews:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data preview:', 
        err.response.data ? JSON.stringify(err.response.data).substring(0, 500) + '...' : 'No data'
      );
    }
  }
}

// Run the script
fetchReviews().catch(console.error);