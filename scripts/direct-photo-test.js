const { Pool } = require('pg');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const OUTSCRAPER_API_KEY = 'MjFhYjYzZGE0OGViNDg2NDk1ODY2MDFhMWZmZTVlOTV8NjhiNjRjZGEwYg';

async function directPhotoTest() {
  const client = await pool.connect();

  try {
    console.log('🚀 Direct photo extraction test (10 businesses, 50 photos max, 5+ threshold)...\n');

    // Get 10 test companies
    const companies = await client.query(`
      SELECT 
        c.id,
        c.name,
        c.place_id,
        c.city,
        c.state
      FROM companies c
      INNER JOIN lead_pipeline lp ON c.id = lp.company_id
      WHERE c.place_id IS NOT NULL
        AND (c.site IS NULL OR c.site = '' OR c.site = 'null')
        AND c.state IN ('Alabama', 'Arkansas')
      ORDER BY c.name
      LIMIT 10;
    `);

    console.log(`📊 Testing with ${companies.rows.length} companies\n`);

    const results = {
      successful: 0,
      skipped: 0,
      errors: 0,
      totalPhotos: 0
    };

    for (let i = 0; i < companies.rows.length; i++) {
      const company = companies.rows[i];
      
      console.log(`${i + 1}/10 🏢 ${company.name} (${company.city}, ${company.state})`);

      try {
        // Call Outscraper API
        const outscrapeUrl = 'https://api.outscraper.com/maps/photos';
        const params = new URLSearchParams({
          query: company.place_id,
          limit: '50',
          async: 'false'
        });

        console.log('     📡 Calling Outscraper API...');
        const response = await fetch(`${outscrapeUrl}?${params}`, {
          headers: {
            'X-API-KEY': OUTSCRAPER_API_KEY,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const photos = data.data?.[0]?.photos || [];

        console.log(`     📸 Found ${photos.length} photos`);

        if (photos.length < 5) {
          console.log(`     ⏭️ Skipping - less than 5 photos`);
          results.skipped++;
        } else {
          // Save photos to database
          const photosToSave = photos.slice(0, 50);
          let saved = 0;

          for (const photo of photosToSave) {
            try {
              await client.query(`
                INSERT INTO business_photos (
                  company_id, 
                  original_url, 
                  width, 
                  height,
                  extracted_at
                ) VALUES ($1, $2, $3, $4, NOW())
              `, [
                company.id,
                photo.photo_url,
                photo.width || null,
                photo.height || null
              ]);
              saved++;
            } catch (err) {
              // Skip duplicate/error photos
            }
          }

          console.log(`     ✅ Saved ${saved} photos`);
          results.successful++;
          results.totalPhotos += saved;
        }

      } catch (error) {
        console.log(`     ❌ Error: ${error.message}`);
        results.errors++;
      }

      // Delay between requests
      if (i < companies.rows.length - 1) {
        console.log('     ⏳ Waiting 2 seconds...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 TEST COMPLETE!');
    console.log(`✅ Successful: ${results.successful} companies`);
    console.log(`⏭️ Skipped: ${results.skipped} companies (< 5 photos)`);
    console.log(`❌ Errors: ${results.errors} companies`);
    console.log(`📸 Total photos saved: ${results.totalPhotos}`);

    // Show sample of saved photos
    const samplePhotos = await client.query(`
      SELECT 
        c.name,
        bp.original_url,
        bp.width,
        bp.height
      FROM business_photos bp
      JOIN companies c ON bp.company_id = c.id
      WHERE bp.extracted_at > NOW() - INTERVAL '5 minutes'
      LIMIT 5;
    `);

    if (samplePhotos.rows.length > 0) {
      console.log('\n📷 Sample saved photos:');
      samplePhotos.rows.forEach((photo, i) => {
        console.log(`  ${i + 1}. ${photo.name}: ${photo.width}x${photo.height}`);
        console.log(`     ${photo.original_url.substring(0, 60)}...`);
      });
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

directPhotoTest();