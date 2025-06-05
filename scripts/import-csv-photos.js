const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function importPhotosFromCSV() {
  const client = await pool.connect();

  try {
    console.log('🚀 Importing photos from Outscraper CSV...\n');

    // Read CSV file
    const csvData = fs.readFileSync('/workspaces/atlaswebsites/Outscraper-20250605195456s9d.csv', 'utf8');
    const lines = csvData.split('\n').slice(1).filter(line => line.trim());

    console.log(`📊 Found ${lines.length} photo records in CSV`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < lines.length; i++) {
      try {
        // Parse CSV line (handle quoted fields)
        const cols = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < lines[i].length; j++) {
          const char = lines[i][j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            cols.push(current);
            current = '';
          } else {
            current += char;
          }
        }
        cols.push(current); // Add last column

        const [
          query, name, google_id, place_id, location_link, 
          photo_id, photo_url, photo_url_big, latitude, longitude, 
          photo_date, photo_upload_source, photo_source_video, 
          photo_tags, photo_tag_ids, original_photo_url
        ] = cols;

        if (!place_id || !photo_url) {
          skipped++;
          continue;
        }

        // Find company by place_id
        const companyResult = await client.query(`
          SELECT id FROM companies WHERE place_id = $1
        `, [place_id]);

        if (companyResult.rows.length === 0) {
          skipped++;
          continue;
        }

        const companyId = companyResult.rows[0].id;

        // Extract photo dimensions from URL if available
        let width = null, height = null;
        const dimensionMatch = photo_url_big?.match(/w(\d+)-h(\d+)/);
        if (dimensionMatch) {
          width = parseInt(dimensionMatch[1]);
          height = parseInt(dimensionMatch[2]);
        }

        // Determine photo type from tags
        let photoType = 'other';
        if (photo_tags) {
          const tags = photo_tags.toLowerCase();
          if (tags.includes('front') || tags.includes('storefront')) photoType = 'storefront';
          else if (tags.includes('people') || tags.includes('team')) photoType = 'team';
          else if (tags.includes('sign')) photoType = 'signage';
          else if (tags.includes('interior')) photoType = 'interior';
        }

        // Insert into business_photos table
        await client.query(`
          INSERT INTO business_photos (
            company_id, 
            original_url, 
            photo_type,
            width,
            height,
            extracted_at
          ) VALUES ($1, $2, $3, $4, $5, NOW())
          ON CONFLICT (company_id, original_url) DO NOTHING
        `, [
          companyId,
          photo_url_big || photo_url,
          photoType,
          width,
          height
        ]);

        imported++;

        if (imported % 100 === 0) {
          console.log(`   📸 Imported ${imported} photos...`);
        }

      } catch (error) {
        errors++;
        if (errors < 5) {
          console.log(`   ⚠️ Error on line ${i + 1}: ${error.message}`);
        }
      }
    }

    // Get summary stats
    const summaryResult = await client.query(`
      SELECT 
        COUNT(*) as total_photos,
        COUNT(DISTINCT company_id) as companies_with_photos,
        photo_type,
        COUNT(*) as type_count
      FROM business_photos
      WHERE extracted_at > NOW() - INTERVAL '1 hour'
      GROUP BY photo_type
      ORDER BY type_count DESC;
    `);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 CSV Import Complete!');
    console.log(`✅ Imported: ${imported} photos`);
    console.log(`⏭️ Skipped: ${skipped} records`);
    console.log(`❌ Errors: ${errors} records`);

    console.log('\n📊 Photos by type:');
    summaryResult.rows.forEach(row => {
      console.log(`  ${row.photo_type}: ${row.type_count} photos`);
    });

    // Show companies ready for Claude analysis
    const companiesReady = await client.query(`
      SELECT 
        c.name,
        c.place_id,
        COUNT(bp.id) as photo_count
      FROM companies c
      INNER JOIN business_photos bp ON c.id = bp.company_id
      WHERE bp.extracted_at > NOW() - INTERVAL '1 hour'
        AND c.state = 'Arkansas'
      GROUP BY c.id, c.name, c.place_id
      HAVING COUNT(bp.id) >= 5
      ORDER BY COUNT(bp.id) DESC
      LIMIT 20;
    `);

    console.log(`\n🤖 Ready for Claude analysis (5+ photos):`);
    companiesReady.rows.forEach((row, i) => {
      console.log(`  ${i + 1}. ${row.name}: ${row.photo_count} photos`);
    });

    console.log(`\n🎯 Next: Run Claude analysis on ${companiesReady.rows.length} companies`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

importPhotosFromCSV();