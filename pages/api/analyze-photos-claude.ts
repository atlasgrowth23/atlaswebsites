import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

interface ClaudeAnalysis {
  category: 'storefront' | 'team' | 'equipment' | 'interior' | 'action' | 'other';
  quality_score: number;
  description: string;
  best_for: string[];
  confidence: number;
  has_people: boolean;
  lighting_quality: 'poor' | 'fair' | 'good' | 'excellent';
}

async function analyzePhotoWithClaude(photoUrl: string): Promise<ClaudeAnalysis> {
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
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
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
    console.error('Claude analysis error:', error);
    // Return default analysis if Claude fails
    return {
      category: 'other',
      quality_score: 5,
      description: 'Analysis failed',
      best_for: [],
      confidence: 0,
      has_people: false,
      lighting_quality: 'fair'
    };
  }
}

async function getImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const client = await pool.connect();

  try {
    const { limit = 20, maxPhotos = 25 } = req.body;

    console.log(`🤖 Starting Claude analysis for ${limit} companies...`);

    // Get companies with 5+ photos
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

    const companies = companiesResult.rows;
    console.log(`📊 Found ${companies.length} companies ready for analysis`);

    const results = {
      processed: 0,
      successful: 0,
      errors: 0,
      total_photos_analyzed: 0,
      companies: [] as any[]
    };

    for (const company of companies) {
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
        const placements: {
          hero_img: { photo_id: any; url: any; score: number } | null;
          about_img: { photo_id: any; url: any; score: number } | null;
          hero_img_2: { photo_id: any; url: any; score: number } | null;
        } = {
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

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Claude Analysis Complete!');
    console.log(`✅ Successful: ${results.successful} companies`);
    console.log(`❌ Errors: ${results.errors} companies`);
    console.log(`📸 Total photos analyzed: ${results.total_photos_analyzed}`);

    return res.status(200).json({
      success: true,
      summary: results
    });

  } catch (error) {
    console.error('❌ Fatal error:', error);
    return res.status(500).json({ 
      error: 'Analysis failed',
      details: error instanceof Error ? error.message : String(error) 
    });
  } finally {
    client.release();
  }
}