const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

// Using direct PostgreSQL connection like the working pattern
const pool = new Pool({
  connectionString: "postgresql://postgres.zjxvacezqbhyomrngynq:Kpm7izZEPQgyXpWY@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true",
  ssl: { rejectUnauthorized: false }
});

async function analyzePhotosWithClaude(maxPhotos = 5, limit = 100) {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting Claude photo analysis for Arkansas companies...');

    // Get companies with photos ready for analysis
    const companiesResult = await client.query(`
      SELECT 
        c.id,
        c.name,
        c.place_id,
        COUNT(bp.id) as photo_count
      FROM companies c
      INNER JOIN business_photos bp ON c.id = bp.company_id
      WHERE c.state = 'Arkansas'
        AND bp.claude_analysis IS NULL
      GROUP BY c.id, c.name, c.place_id
      HAVING COUNT(bp.id) >= 5
      ORDER BY COUNT(bp.id) DESC
      LIMIT $1;
    `, [limit]);

    console.log(`📊 Found ${companiesResult.rows.length} companies ready for analysis`);

    const results = {
      processed: 0,
      successful: 0,
      errors: 0,
      total_photos_analyzed: 0,
      companies: []
    };

    for (const company of companiesResult.rows) {
      try {
        console.log(`\n🏢 Processing: ${company.name} (${company.photo_count} photos)`);

        // Get photos for this company (limit to maxPhotos)
        const photosResult = await client.query(`
          SELECT id, original_url, photo_type
          FROM business_photos
          WHERE company_id = $1 
            AND claude_analysis IS NULL
          ORDER BY 
            CASE photo_type 
              WHEN 'storefront' THEN 1
              WHEN 'team' THEN 2  
              WHEN 'signage' THEN 3
              ELSE 4
            END,
            created_at DESC
          LIMIT $2;
        `, [company.id, maxPhotos]);

        const photos = photosResult.rows;
        console.log(`   📸 Analyzing ${photos.length} photos...`);

        let analyzed = 0;
        const placements = {
          hero_img: null,
          about_img: null,
          hero_img_2: null
        };

        for (const photo of photos) {
          try {
            console.log(`      🔍 Analyzing photo ${analyzed + 1}/${photos.length}...`);
            
            const analysis = await analyzePhotoWithClaude(photo.original_url);
            
            // Update photo with Claude analysis
            await client.query(`
              UPDATE business_photos 
              SET 
                claude_analysis = $1,
                photo_type = $2,
                quality_score = $3,
                updated_at = NOW()
              WHERE id = $4;
            `, [
              JSON.stringify(analysis),
              analysis.category,
              analysis.quality_score,
              photo.id
            ]);

            // Track best photos for placement
            if (analysis.quality_score >= 8 && analysis.best_for.includes('hero_img') && !placements.hero_img) {
              placements.hero_img = { photo_id: photo.id, url: photo.original_url, score: analysis.quality_score };
            }
            if (analysis.quality_score >= 7 && analysis.best_for.includes('about_img') && !placements.about_img) {
              placements.about_img = { photo_id: photo.id, url: photo.original_url, score: analysis.quality_score };
            }
            if (analysis.quality_score >= 6 && analysis.best_for.includes('hero_img_2') && !placements.hero_img_2) {
              placements.hero_img_2 = { photo_id: photo.id, url: photo.original_url, score: analysis.quality_score };
            }

            analyzed++;

            // Small delay to be respectful to Claude API
            await new Promise(resolve => setTimeout(resolve, 500));

          } catch (photoError) {
            console.log(`      ⚠️ Failed to analyze photo: ${photoError instanceof Error ? photoError.message : String(photoError)}`);
          }
        }

        console.log(`   ✅ Analyzed ${analyzed} photos`);

        results.successful++;
        results.total_photos_analyzed += analyzed;
        results.companies.push({
          name: company.name,
          status: 'success',
          photos_analyzed: analyzed,
          placements: placements,
          best_photos: Object.values(placements).filter(p => p !== null).length
        });

      } catch (error) {
        console.log(`   ❌ Error processing ${company.name}: ${error instanceof Error ? error.message : String(error)}`);
        results.errors++;
        results.companies.push({
          name: company.name,
          error: error instanceof Error ? error.message : String(error)
        });
      }

      results.processed++;
    }

    console.log('\n🎉 Analysis complete!');
    console.log(`📊 Summary: ${results.successful}/${results.processed} companies successful`);
    console.log(`📸 Total photos analyzed: ${results.total_photos_analyzed}`);

    return results;

  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function analyzePhotoWithClaude(photoUrl) {
  try {
    const prompt = `Analyze this HVAC/heating/air conditioning business photo. Provide a JSON response with:
    
{
  "category": "storefront|team|equipment|interior|action|other",
  "quality_score": 1-10,
  "description": "Brief description of what you see",
  "best_for": ["hero_img", "about_img", "hero_img_2"],
  "confidence": 0.0-1.0,
  "has_people": true/false,
  "lighting_quality": "poor|fair|good|excellent"
}

Focus on:
- storefront: Building exteriors, signage, company vehicles
- team: People, technicians, staff
- equipment: HVAC units, tools, installations
- interior: Office spaces, warehouse, work areas
- action: Service work, installations in progress

Rate quality based on: clarity, composition, lighting, professional appearance
Best placement: hero_img (main background), about_img (company story), hero_img_2 (secondary)`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [{
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: await getImageAsBase64(photoUrl)
            }
          }, {
            type: 'text',
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('No valid JSON in Claude response');

  } catch (error) {
    console.error('Error analyzing with Claude:', error);
    throw error;
  }
}

async function getImageAsBase64(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
  } catch (error) {
    console.error('Error fetching image:', error);
    throw error;
  }
}

// Run with all Arkansas companies
analyzePhotosWithClaude(5, 100).catch(console.error);