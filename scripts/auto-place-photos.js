const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function autoPlacePhotos() {
  const client = await pool.connect();

  try {
    console.log('🤖 Auto-placing best photos for Arkansas companies...\n');

    // Get companies with analyzed photos
    const companiesResult = await client.query(`
      SELECT 
        c.id,
        c.name,
        c.slug,
        COUNT(bp.id) as total_photos
      FROM companies c
      INNER JOIN business_photos bp ON c.id = bp.company_id
      WHERE c.state = 'Arkansas'
        AND bp.claude_analysis IS NOT NULL
        AND (c.site IS NULL OR c.site = '' OR c.site = 'null')
      GROUP BY c.id, c.name, c.slug
      HAVING COUNT(bp.id) >= 5
      ORDER BY COUNT(bp.id) DESC
      LIMIT 20;
    `);

    console.log(`📊 Processing ${companiesResult.rows.length} companies for auto-placement\n`);

    const results = {
      processed: 0,
      successful: 0,
      errors: 0,
      placements: {
        hero_img: 0,
        about_img: 0,
        hero_img_2: 0
      },
      companies: []
    };

    for (const company of companiesResult.rows) {
      try {
        console.log(`🏢 ${company.name} (${company.total_photos} photos)`);

        // Find best photos for each frame slot
        const bestPhotos = await client.query(`
          SELECT 
            bp.id,
            bp.original_url,
            bp.quality_score,
            bp.photo_type,
            bp.claude_analysis,
            (bp.claude_analysis->>'category') as category,
            (bp.claude_analysis->>'best_for') as best_for_json,
            (bp.claude_analysis->>'description') as description
          FROM business_photos bp
          WHERE bp.company_id = $1
            AND bp.claude_analysis IS NOT NULL
            AND bp.quality_score >= 6
          ORDER BY bp.quality_score DESC, bp.created_at DESC;
        `, [company.id]);

        const photos = bestPhotos.rows;
        console.log(`   📸 Found ${photos.length} quality photos (score 6+)`);

        // Smart placement logic
        const placements = {
          hero_img: null,
          about_img: null,
          hero_img_2: null
        };

        for (const photo of photos) {
          try {
            const bestFor = JSON.parse(photo.best_for_json || '[]');
            const score = photo.quality_score;
            const category = photo.category;

            // Hero image: prioritize storefront/building photos with high scores
            if (!placements.hero_img && score >= 8 && 
                (bestFor.includes('hero_img') || category === 'storefront') &&
                (category === 'storefront' || category === 'equipment')) {
              placements.hero_img = photo;
            }

            // About image: prioritize team/interior photos or high-quality equipment
            if (!placements.about_img && score >= 7 &&
                (bestFor.includes('about_img') || category === 'team' || category === 'interior')) {
              placements.about_img = photo;
            }

            // Hero image 2: secondary storefront or action shots
            if (!placements.hero_img_2 && score >= 6 &&
                (bestFor.includes('hero_img_2') || category === 'action' || category === 'equipment')) {
              placements.hero_img_2 = photo;
            }

            // Fill gaps with best available photos
            if (!placements.hero_img && score >= 7) placements.hero_img = photo;
            if (!placements.about_img && score >= 6) placements.about_img = photo;
            if (!placements.hero_img_2 && score >= 5) placements.hero_img_2 = photo;
          } catch (parseError) {
            // Skip photos with JSON parsing issues
          }
        }

        const placedCount = Object.values(placements).filter(p => p !== null).length;
        console.log(`   🎯 Selected ${placedCount}/3 placements:`);

        // Update company_frames with selected photos
        for (const [frameSlug, photo] of Object.entries(placements)) {
          if (photo) {
            try {
              // Add cache-busting timestamp
              const photoUrl = `${photo.original_url}?v=${Date.now()}`;

              await client.query(`
                INSERT INTO company_frames (company_id, slug, url, created_at, updated_at)
                VALUES ($1, $2, $3, NOW(), NOW())
                ON CONFLICT (company_id, slug) 
                DO UPDATE SET 
                  url = EXCLUDED.url,
                  updated_at = NOW();
              `, [company.id, frameSlug, photoUrl]);

              console.log(`      ✅ ${frameSlug}: ${photo.category} (${photo.quality_score}/10) - ${photo.description.substring(0, 50)}...`);
              
              results.placements[frameSlug]++;

            } catch (updateError) {
              console.log(`      ❌ Failed to update ${frameSlug}: ${updateError.message}`);
            }
          } else {
            console.log(`      ⏭️ ${frameSlug}: No suitable photo found`);
          }
        }

        results.successful++;
        results.companies.push({
          name: company.name,
          slug: company.slug,
          placements_made: placedCount,
          hero_img: placements.hero_img ? placements.hero_img.quality_score : null,
          about_img: placements.about_img ? placements.about_img.quality_score : null,
          hero_img_2: placements.hero_img_2 ? placements.hero_img_2.quality_score : null
        });

      } catch (error) {
        console.log(`   ❌ Error processing ${company.name}: ${error.message}`);
        results.errors++;
        results.companies.push({
          name: company.name,
          error: error.message
        });
      }

      results.processed++;
      console.log(''); // Empty line between companies
    }

    console.log('=' * 60);
    console.log('🎉 AUTO-PLACEMENT COMPLETE!');
    console.log(`✅ Successful: ${results.successful} companies`);
    console.log(`❌ Errors: ${results.errors} companies`);
    console.log(`🖼️ Total placements made:`);
    console.log(`   hero_img: ${results.placements.hero_img} companies`);
    console.log(`   about_img: ${results.placements.about_img} companies`);
    console.log(`   hero_img_2: ${results.placements.hero_img_2} companies`);

    console.log('\n📋 Company placement summary:');
    results.companies.slice(0, 10).forEach((company, i) => {
      if (company.placements_made) {
        console.log(`  ${i + 1}. ${company.name}: ${company.placements_made}/3 placements (${company.hero_img || 'x'}/${company.about_img || 'x'}/${company.hero_img_2 || 'x'})`);
      }
    });

    // Show sample websites to test
    const testCompanies = results.companies.filter(c => c.placements_made >= 2).slice(0, 5);
    console.log('\n🌐 Test these company websites:');
    testCompanies.forEach((company, i) => {
      console.log(`  ${i + 1}. https://your-domain.com/company/${company.slug}`);
    });

    console.log('\n🚀 Next: Check websites to see new photos displayed!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

autoPlacePhotos();