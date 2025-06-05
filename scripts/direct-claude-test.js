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

    console.log('     🔍 Downloading image...');
    const imageBase64 = await getImageAsBase64(photoUrl);
    
    console.log('     🤖 Calling Claude API...');
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
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    console.log('     📋 Claude response:', content.substring(0, 100) + '...');
    
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

async function directClaudeTest() {
  const client = await pool.connect();

  try {
    console.log('🤖 Direct Claude analysis test (2 companies, 3 photos each)...\n');

    // Get 2 companies with most photos
    const companies = await client.query(`
      SELECT 
        c.id,
        c.name,
        COUNT(bp.id) as photo_count
      FROM companies c
      INNER JOIN business_photos bp ON c.id = bp.company_id
      WHERE c.state = 'Arkansas'
      GROUP BY c.id, c.name
      HAVING COUNT(bp.id) >= 5
      ORDER BY COUNT(bp.id) DESC
      LIMIT 2;
    `);

    console.log(`📊 Testing with ${companies.rows.length} companies\n`);

    for (let i = 0; i < companies.rows.length; i++) {
      const company = companies.rows[i];
      
      console.log(`${i + 1}/2 🏢 ${company.name} (${company.photo_count} photos available)`);

      // Get top 3 photos for this company
      const photos = await client.query(`
        SELECT id, original_url, photo_type
        FROM business_photos
        WHERE company_id = $1
        ORDER BY 
          CASE photo_type 
            WHEN 'storefront' THEN 1
            WHEN 'team' THEN 2
            ELSE 3
          END,
          created_at DESC
        LIMIT 3;
      `, [company.id]);

      console.log(`     📸 Analyzing ${photos.rows.length} photos...`);

      for (let j = 0; j < photos.rows.length; j++) {
        const photo = photos.rows[j];
        
        console.log(`     Photo ${j + 1}/3: ${photo.photo_type}`);
        console.log(`     URL: ${photo.original_url.substring(0, 60)}...`);

        const analysis = await analyzePhotoWithClaude(photo.original_url);

        console.log(`     ✅ Analysis complete:`);
        console.log(`        Category: ${analysis.category}`);
        console.log(`        Quality: ${analysis.quality_score}/10`);
        console.log(`        Description: ${analysis.description}`);
        console.log(`        Best for: ${analysis.best_for.join(', ') || 'none'}`);

        // Update database with analysis
        await client.query(`
          UPDATE business_photos 
          SET 
            claude_analysis = $1,
            quality_score = $2,
            analyzed_at = NOW()
          WHERE id = $3
        `, [
          JSON.stringify(analysis),
          analysis.quality_score,
          photo.id
        ]);

        console.log(`        💾 Saved to database\n`);
      }
    }

    console.log('🎉 Direct Claude test complete!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

directClaudeTest();