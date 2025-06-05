const { Pool } = require('pg');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function selectPhotosForTemplate(companyName, photos) {
  try {
    const prompt = `You are helping select the best photos for an HVAC company website template. 

Company: ${companyName}

I will show you ${photos.length} photos from this company. Please select the BEST photo for each website template slot:

**TEMPLATE SLOTS NEEDED:**
1. **hero_img** - Main hero background (professional storefront, building exterior, or impressive equipment)
2. **about_img** - About section image (team/people, interior office, or high-quality equipment) 
3. **hero_img_2** - Secondary hero image (different angle, equipment in action, or team working)

**SELECTION CRITERIA:**
- Professional appearance and good lighting
- Clear, high-resolution images
- Appropriate for business website
- Different photos for each slot (no duplicates)
- If no perfect match exists, pick the best available

**RESPONSE FORMAT:**
Return ONLY a JSON object like this:
{
  "hero_img": "photo_url_here",
  "about_img": "photo_url_here", 
  "hero_img_2": "photo_url_here",
  "reasoning": "Brief explanation of choices"
}

Here are the available photos:`;

    // Create a text list of photos for Claude
    const photoList = photos.map((photo, i) => 
      `${i + 1}. ${photo.original_url}`
    ).join('\n');

    const fullPrompt = prompt + '\n\n' + photoList;

    console.log('     🤖 Asking Claude to select best photos for template slots...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: fullPrompt
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    console.log('     📋 Claude response:', content.substring(0, 100) + '...');
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{.*\}/s);
    if (jsonMatch) {
      const selection = JSON.parse(jsonMatch[0]);
      
      // Validate that selected URLs exist in our photo list
      const photoUrls = photos.map(p => p.original_url);
      const validSelection = {};
      
      for (const [slot, url] of Object.entries(selection)) {
        if (slot !== 'reasoning' && photoUrls.includes(url)) {
          validSelection[slot] = url;
        }
      }
      
      return {
        ...validSelection,
        reasoning: selection.reasoning || 'No reasoning provided'
      };
    }
    
    throw new Error('No valid JSON in Claude response');

  } catch (error) {
    console.error('     ❌ Template selection error:', error.message);
    return null;
  }
}

async function templateBasedSelection() {
  const client = await pool.connect();

  try {
    console.log('🎯 Template-based photo selection for Arkansas companies...\n');

    // Get companies with most photos (ready for selection)
    const companiesResult = await client.query(`
      SELECT 
        c.id,
        c.name,
        c.slug,
        COUNT(bp.id) as photo_count
      FROM companies c
      INNER JOIN business_photos bp ON c.id = bp.company_id
      WHERE c.state = 'Arkansas'
        AND (c.site IS NULL OR c.site = '' OR c.site = 'null')
      GROUP BY c.id, c.name, c.slug
      HAVING COUNT(bp.id) >= 5
      ORDER BY COUNT(bp.id) DESC
      LIMIT 100;
    `);

    console.log(`📊 Processing ${companiesResult.rows.length} companies for template selection\n`);

    const results = {
      processed: 0,
      successful: 0,
      errors: 0,
      total_placements: 0,
      companies: []
    };

    for (const company of companiesResult.rows) {
      try {
        console.log(`🏢 ${company.name} (${company.photo_count} photos available)`);

        // Get photos for this company (limit to 20 for Claude processing)
        const photosResult = await client.query(`
          SELECT 
            id,
            original_url,
            photo_type
          FROM business_photos
          WHERE company_id = $1
          ORDER BY 
            CASE photo_type 
              WHEN 'storefront' THEN 1
              WHEN 'team' THEN 2
              WHEN 'signage' THEN 3
              WHEN 'equipment' THEN 4
              ELSE 5
            END,
            created_at DESC
          LIMIT 20;
        `, [company.id]);

        const photos = photosResult.rows;
        console.log(`     📸 Sending ${photos.length} photos to Claude for template selection...`);

        // Ask Claude to select best photos for template slots
        const selection = await selectPhotosForTemplate(company.name, photos);

        if (!selection) {
          throw new Error('Claude selection failed');
        }

        console.log(`     ✅ Claude selected photos for template:`);
        console.log(`        Reasoning: ${selection.reasoning}`);

        // Update company_frames with selected photos
        let placementsMade = 0;
        const placementDetails = {};

        for (const [frameSlug, photoUrl] of Object.entries(selection)) {
          if (frameSlug !== 'reasoning' && photoUrl) {
            try {
              // Add cache-busting timestamp
              const finalUrl = `${photoUrl}?v=${Date.now()}`;

              await client.query(`
                INSERT INTO company_frames (company_id, slug, url, created_at, updated_at)
                VALUES ($1, $2, $3, NOW(), NOW())
                ON CONFLICT (company_id, slug) 
                DO UPDATE SET 
                  url = EXCLUDED.url,
                  updated_at = NOW();
              `, [company.id, frameSlug, finalUrl]);

              console.log(`        ✅ ${frameSlug}: Photo placed`);
              placementsMade++;
              placementDetails[frameSlug] = true;

            } catch (updateError) {
              console.log(`        ❌ Failed to place ${frameSlug}: ${updateError.message}`);
            }
          }
        }

        console.log(`     🎯 Placed ${placementsMade}/3 photos in template slots`);

        results.successful++;
        results.total_placements += placementsMade;
        results.companies.push({
          name: company.name,
          slug: company.slug,
          placements_made: placementsMade,
          placements: placementDetails,
          reasoning: selection.reasoning
        });

        // Small delay between companies
        await new Promise(resolve => setTimeout(resolve, 2000));

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
    console.log('🎉 TEMPLATE-BASED SELECTION COMPLETE!');
    console.log(`✅ Successful: ${results.successful} companies`);
    console.log(`❌ Errors: ${results.errors} companies`);
    console.log(`🖼️ Total placements: ${results.total_placements} photos`);
    console.log(`💰 Estimated cost: ~$${(results.processed * 0.15).toFixed(2)}`);

    console.log('\n📋 Company results:');
    results.companies.forEach((company, i) => {
      if (company.placements_made) {
        console.log(`  ${i + 1}. ${company.name}: ${company.placements_made}/3 placements`);
        console.log(`     Slots: ${Object.keys(company.placements).join(', ')}`);
        console.log(`     Reasoning: ${company.reasoning.substring(0, 80)}...`);
      } else if (company.error) {
        console.log(`  ${i + 1}. ${company.name}: ERROR - ${company.error}`);
      }
    });

    // Show sample websites to test
    const successfulCompanies = results.companies.filter(c => c.placements_made >= 2);
    if (successfulCompanies.length > 0) {
      console.log('\n🌐 Test these company websites:');
      successfulCompanies.slice(0, 5).forEach((company, i) => {
        console.log(`  ${i + 1}. https://your-domain.com/company/${company.slug}`);
      });
    }

    console.log('\n🚀 Template-based selection complete! Check websites to see results.');

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

templateBasedSelection();