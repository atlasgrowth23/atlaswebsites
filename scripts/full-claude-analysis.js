const { Pool } = require('pg');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function getImageAsBase64(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
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

    const imageBase64 = await getImageAsBase64(photoUrl);
    
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
              data: imageBase64
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
    const jsonMatch = content.match(/\{.*\}/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('No valid JSON in Claude response');

  } catch (error) {
    console.error('     ❌ Claude analysis error:', error.message);
    return {
      category: 'other',
      quality_score: 5,
      description: 'Analysis failed: ' + error.message,
      best_for: [],
      confidence: 0,
      has_people: false,
      lighting_quality: 'fair'
    };
  }
}

async function fullClaudeAnalysis() {
  const client = await pool.connect();

  try {
    console.log('🤖 Full Claude analysis: 20 companies, max 25 photos each...\n');

    // Get top 20 companies with most photos (5+ photos)
    const companies = await client.query(`
      SELECT 
        c.id,
        c.name,
        COUNT(bp.id) as photo_count
      FROM companies c
      INNER JOIN business_photos bp ON c.id = bp.company_id
      WHERE c.state = 'Arkansas'
        AND bp.claude_analysis IS NULL
      GROUP BY c.id, c.name
      HAVING COUNT(bp.id) >= 5
      ORDER BY COUNT(bp.id) DESC
      LIMIT 20;
    `);

    console.log(`📊 Analyzing ${companies.rows.length} companies\n`);

    const results = {
      processed: 0,
      successful: 0,
      errors: 0,
      total_photos_analyzed: 0,
      companies: [],
      placements: {}
    };

    for (let i = 0; i < companies.rows.length; i++) {
      const company = companies.rows[i];
      
      console.log(`${i + 1}/20 🏢 ${company.name} (${company.photo_count} photos available)`);

      try {
        // Get top 25 photos for this company (prioritize storefront/team)
        const photos = await client.query(`
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
          LIMIT 25;
        `, [company.id]);

        console.log(`     📸 Analyzing ${photos.rows.length} photos...`);

        let analyzed = 0;
        const placements = {
          hero_img: null,
          about_img: null,
          hero_img_2: null
        };

        for (const photo of photos.rows) {
          try {
            const analysis = await analyzePhotoWithClaude(photo.original_url);
            
            // Update photo with Claude analysis
            await client.query(`
              UPDATE business_photos 
              SET 
                claude_analysis = $1,
                photo_type = $2,
                quality_score = $3,
                analyzed_at = NOW()
              WHERE id = $4
            `, [
              JSON.stringify(analysis),
              analysis.category,
              analysis.quality_score,
              photo.id
            ]);

            // Track best photos for placement
            if (analysis.quality_score >= 8 && analysis.best_for.includes('hero_img') && !placements.hero_img) {
              placements.hero_img = { photo_id: photo.id, url: photo.original_url, score: analysis.quality_score, category: analysis.category };
            }
            if (analysis.quality_score >= 7 && analysis.best_for.includes('about_img') && !placements.about_img) {
              placements.about_img = { photo_id: photo.id, url: photo.original_url, score: analysis.quality_score, category: analysis.category };
            }
            if (analysis.quality_score >= 6 && analysis.best_for.includes('hero_img_2') && !placements.hero_img_2) {
              placements.hero_img_2 = { photo_id: photo.id, url: photo.original_url, score: analysis.quality_score, category: analysis.category };
            }

            analyzed++;
            console.log(`        ${analyzed}/${photos.rows.length}: ${analysis.category} (${analysis.quality_score}/10)`);

            // Small delay to be respectful to Claude API
            await new Promise(resolve => setTimeout(resolve, 1000));

          } catch (photoError) {
            console.log(`        ⚠️ Failed to analyze photo: ${photoError.message}`);
          }
        }

        console.log(`     ✅ Analyzed ${analyzed} photos`);
        console.log(`     🎯 Best photos: hero_img=${placements.hero_img ? placements.hero_img.score : 'none'}, about_img=${placements.about_img ? placements.about_img.score : 'none'}, hero_img_2=${placements.hero_img_2 ? placements.hero_img_2.score : 'none'}`);

        results.successful++;
        results.total_photos_analyzed += analyzed;
        results.companies.push({
          name: company.name,
          id: company.id,
          photos_analyzed: analyzed,
          placements: placements
        });
        results.placements[company.id] = placements;

      } catch (error) {
        console.log(`     ❌ Error processing ${company.name}: ${error.message}`);
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
    console.log('🎉 FULL CLAUDE ANALYSIS COMPLETE!');
    console.log(`✅ Successful: ${results.successful} companies`);
    console.log(`❌ Errors: ${results.errors} companies`);
    console.log(`📸 Total photos analyzed: ${results.total_photos_analyzed}`);
    console.log(`💰 Estimated cost: ~$${(results.total_photos_analyzed * 0.12).toFixed(2)}`);

    // Show companies ready for auto-placement
    const readyForPlacement = results.companies.filter(c => 
      c.placements && (c.placements.hero_img || c.placements.about_img || c.placements.hero_img_2)
    );

    console.log(`\n🎯 Ready for auto-placement: ${readyForPlacement.length} companies`);
    readyForPlacement.slice(0, 10).forEach((company, i) => {
      console.log(`  ${i + 1}. ${company.name}: ${Object.values(company.placements).filter(p => p !== null).length} placements`);
    });

    console.log('\n🚀 Next step: Run auto-placement to update company_frames');

    return results;

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fullClaudeAnalysis();