import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

// Initialize DB connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const OUTSCRAPER_API_KEY = 'MjFhYjYzZGE0OGViNDg2NDk1ODY2MDFhMWZmZTVlOTV8NjhiNjRjZGEwYg';

interface OutscraperPhoto {
  photo_url: string;
  photo_id: string;
  width?: number;
  height?: number;
}

interface OutscraperResponse {
  data: Array<{
    place_id: string;
    name: string;
    photos?: OutscraperPhoto[];
  }>;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const client = await pool.connect();

  try {
    console.log('🚀 Starting photo extraction test...');

    // Get 10 test companies without sites
    const testCompaniesQuery = await client.query(`
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

    const companies = testCompaniesQuery.rows;
    console.log(`📊 Selected ${companies.length} test companies`);

    const results = {
      processed: 0,
      successful: 0,
      skipped: 0,
      errors: 0,
      companies: [] as any[]
    };

    for (const company of companies) {
      try {
        console.log(`\n🏢 Processing: ${company.name} (${company.city}, ${company.state})`);
        console.log(`   Place ID: ${company.place_id}`);

        // Call Outscraper API
        const outscrapeUrl = 'https://api.outscraper.com/maps/photos-v2';
        const outscrapeParams = new URLSearchParams({
          query: company.place_id,
          limit: '50', // Max 50 photos
          async: 'false'
        });

        const response = await fetch(`${outscrapeUrl}?${outscrapeParams}`, {
          headers: {
            'X-API-KEY': OUTSCRAPER_API_KEY,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Outscraper API error: ${response.status} ${response.statusText}`);
        }

        const data: OutscraperResponse = await response.json();
        
        if (!data.data || data.data.length === 0) {
          console.log(`   ⚠️ No data returned from Outscraper`);
          results.skipped++;
          continue;
        }

        const businessData = data.data[0];
        const photos = businessData.photos || [];

        console.log(`   📸 Found ${photos.length} photos`);

        // Skip if less than 5 photos
        if (photos.length < 5) {
          console.log(`   ⏭️ Skipping - less than 5 photos (${photos.length})`);
          results.skipped++;
          results.companies.push({
            name: company.name,
            status: 'skipped',
            reason: `Only ${photos.length} photos found`,
            photos_count: photos.length
          });
          continue;
        }

        // Limit to 50 photos max
        const photosToProcess = photos.slice(0, 50);
        console.log(`   💾 Processing ${photosToProcess.length} photos`);

        // Save photos to business_photos table
        let savedPhotos = 0;
        for (const photo of photosToProcess) {
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
            savedPhotos++;
          } catch (photoError) {
            console.log(`   ⚠️ Failed to save photo: ${photoError.message}`);
          }
        }

        console.log(`   ✅ Saved ${savedPhotos}/${photosToProcess.length} photos`);

        results.successful++;
        results.companies.push({
          name: company.name,
          city: company.city,
          state: company.state,
          status: 'success',
          photos_found: photos.length,
          photos_saved: savedPhotos,
          place_id: company.place_id
        });

      } catch (error) {
        console.log(`   ❌ Error processing ${company.name}: ${error.message}`);
        results.errors++;
        results.companies.push({
          name: company.name,
          status: 'error',
          error: error.message
        });
      }

      results.processed++;

      // Add delay between requests to be respectful to API
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Get summary stats
    const summaryQuery = await client.query(`
      SELECT 
        COUNT(*) as total_photos,
        COUNT(DISTINCT company_id) as companies_with_photos,
        AVG(CASE WHEN width > 0 THEN width END) as avg_width,
        AVG(CASE WHEN height > 0 THEN height END) as avg_height
      FROM business_photos
      WHERE extracted_at > NOW() - INTERVAL '1 hour';
    `);

    const summary = summaryQuery.rows[0];

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Photo extraction test completed!');
    console.log(`📊 Processed: ${results.processed} companies`);
    console.log(`✅ Successful: ${results.successful} companies`);
    console.log(`⏭️ Skipped: ${results.skipped} companies`);
    console.log(`❌ Errors: ${results.errors} companies`);
    console.log(`📸 Total photos saved: ${summary.total_photos}`);

    return res.status(200).json({
      success: true,
      summary: {
        processed: results.processed,
        successful: results.successful,
        skipped: results.skipped,
        errors: results.errors,
        total_photos_saved: parseInt(summary.total_photos),
        companies_with_photos: parseInt(summary.companies_with_photos),
        avg_dimensions: {
          width: Math.round(summary.avg_width || 0),
          height: Math.round(summary.avg_height || 0)
        }
      },
      companies: results.companies
    });

  } catch (error) {
    console.error('❌ Fatal error:', error);
    return res.status(500).json({ 
      error: 'Photo extraction failed',
      details: error.message 
    });
  } finally {
    client.release();
  }
}