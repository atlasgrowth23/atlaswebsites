const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config({ path: 'env.local' });

const OUTSCRAPER_API_KEY = 'MjFhYjYzZGE0OGViNDg2NDk1ODY2MDFhMWZmZTVlOTV8NjhiNjRjZGEwYg';

async function testByName() {
  try {
    console.log('🔍 Testing Outscraper with business name instead of place ID...\n');

    // Test with a well-known business name
    const testQuery = "Aaron Frost Refrigeration Heating and Cooling, Dothan, Alabama";
    
    console.log(`🏢 Testing query: ${testQuery}`);

    const outscrapeUrl = 'https://api.outscraper.com/maps/photos';
    const params = new URLSearchParams({
      query: testQuery,
      limit: '10',
      async: 'false'
    });

    console.log(`📡 API URL: ${outscrapeUrl}?${params}`);
    console.log('📡 Calling Outscraper API...');

    const response = await fetch(`${outscrapeUrl}?${params}`, {
      headers: {
        'X-API-KEY': OUTSCRAPER_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📊 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Error response: ${errorText}`);
      return;
    }

    const data = await response.json();
    console.log('\n📋 API Response:');
    console.log(JSON.stringify(data, null, 2));

    if (data.data && data.data.length > 0) {
      const businessData = data.data[0];
      const photos = businessData.photos || [];
      
      console.log(`\n📸 Found ${photos.length} photos`);
      
      if (photos.length > 0) {
        console.log('\n📷 Photo URLs:');
        photos.slice(0, 3).forEach((photo, i) => {
          console.log(`  ${i + 1}. ${photo.photo_url}`);
        });
      }
    }

    // Also test the Google Business endpoint
    console.log('\n' + '='.repeat(50));
    console.log('🔍 Testing Google Business endpoint...\n');

    const gbUrl = 'https://api.outscraper.com/maps/places-photos';
    const gbParams = new URLSearchParams({
      query: testQuery,
      limit: '10'
    });

    const gbResponse = await fetch(`${gbUrl}?${gbParams}`, {
      headers: {
        'X-API-KEY': OUTSCRAPER_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📊 GB Response status: ${gbResponse.status} ${gbResponse.statusText}`);

    if (gbResponse.ok) {
      const gbData = await gbResponse.json();
      console.log('\n📋 Google Business API Response:');
      console.log(JSON.stringify(gbData, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testByName();