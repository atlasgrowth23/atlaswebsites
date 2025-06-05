const { Pool } = require('pg');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const OUTSCRAPER_API_KEY = 'MjFhYjYzZGE0OGViNDg2NDk1ODY2MDFhMWZmZTVlOTV8NjhiNjRjZGEwYg';

async function testSingleCompany() {
  const client = await pool.connect();

  try {
    console.log('🔍 Testing single company for photo extraction...\n');

    // Get one company with a good place_id
    const company = await client.query(`
      SELECT 
        c.id,
        c.name,
        c.place_id,
        c.city,
        c.state
      FROM companies c
      INNER JOIN lead_pipeline lp ON c.id = lp.company_id
      WHERE c.place_id IS NOT NULL
        AND c.place_id != ''
        AND c.name LIKE '%Air%'
        AND c.state = 'Alabama'
      LIMIT 1;
    `);

    if (company.rows.length === 0) {
      console.log('❌ No test company found');
      return;
    }

    const testCompany = company.rows[0];
    console.log(`🏢 Testing: ${testCompany.name}`);
    console.log(`📍 Location: ${testCompany.city}, ${testCompany.state}`);
    console.log(`🆔 Place ID: ${testCompany.place_id}\n`);

    // Test Outscraper API with detailed logging
    const outscrapeUrl = 'https://api.outscraper.com/maps/photos';
    const params = new URLSearchParams({
      query: testCompany.place_id,
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
    console.log('📋 Full API Response:');
    console.log(JSON.stringify(data, null, 2));

    if (data.data && data.data.length > 0) {
      const businessData = data.data[0];
      const photos = businessData.photos || [];
      
      console.log(`\n📸 Found ${photos.length} photos for ${businessData.name || 'Unknown'}`);
      
      if (photos.length > 0) {
        console.log('\n📷 Photo details:');
        photos.slice(0, 3).forEach((photo, i) => {
          console.log(`  ${i + 1}. ${photo.photo_url}`);
          console.log(`     Size: ${photo.width}x${photo.height}`);
        });
      }
    } else {
      console.log('❌ No business data returned');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testSingleCompany();