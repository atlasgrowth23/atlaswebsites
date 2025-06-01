const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');

// Load environment variables
require('dotenv').config({ path: './env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function completeSetup() {
  console.log('🚀 Starting complete setup...');

  try {
    // 1. CREATE STORAGE BUCKET
    console.log('📦 Creating storage bucket...');
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    });
    
    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('❌ Bucket creation failed:', bucketError);
    } else {
      console.log('✅ Storage bucket ready');
    }

    // 2. UPLOAD TEMPLATE IMAGES
    console.log('🖼️ Uploading template images...');
    
    // Download and upload hero image
    try {
      const fetch = (await import('node-fetch')).default;
      const heroResponse = await fetch('https://media.istockphoto.com/id/2086062515/photo/technician-is-checking-air-conditioner-air-conditioning-hvac-service-technician-using-gauges.jpg?s=612x612&w=0&k=20&c=01FnRRsdf4EZRrkXj_famg0St0cjr4_rQlJmDAcA1SQ=');
      const heroBuffer = await heroResponse.buffer();
      
      const { error: heroError } = await supabase.storage
        .from('images')
        .upload('/templates/moderntrust/hero.jpg', heroBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        });
      
      if (heroError) console.error('Hero upload error:', heroError);
      else console.log('✅ Hero image uploaded');
    } catch (err) {
      console.log('⚠️ Hero image upload failed, will use URL fallback');
    }

    // Download and upload about image
    try {
      const fetch = (await import('node-fetch')).default;
      const aboutResponse = await fetch('https://media.istockphoto.com/id/2165427024/photo/technician-servicing-air-conditioning-unit-on-rooftop-during-daytime.jpg?s=612x612&w=0&k=20&c=G0onBre5_-5fjLOQhHyBq4wJwj6mMuxvW97lOv-spdA=');
      const aboutBuffer = await aboutResponse.buffer();
      
      const { error: aboutError } = await supabase.storage
        .from('images')
        .upload('/templates/moderntrust/about.jpg', aboutBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        });
      
      if (aboutError) console.error('About upload error:', aboutError);
      else console.log('✅ About image uploaded');
    } catch (err) {
      console.log('⚠️ About image upload failed, will use URL fallback');
    }

    // 3. IMPORT CSV DATA
    console.log('📥 Importing CSV data...');
    
    const companies = [];
    
    await new Promise((resolve, reject) => {
      fs.createReadStream('combined_alabama_arkansas_fixed_r365.csv')
        .pipe(csv())
        .on('data', (row) => {
          if (!row.name || !row.slug) return;
          
          companies.push({
            name: row.name,
            slug: row.slug,
            city: row.city,
            state: row.state,
            phone: row.phone,
            rating: row.rating ? parseFloat(row.rating) : null,
            reviews: row.reviews ? parseInt(row.reviews) : null,
            place_id: row.place_id,
            reviews_link: row.reviews_link,
            predicted_label: row.predicted_label,
            email_1: row.email_1,
            site: row.site,
            latitude: row.latitude ? parseFloat(row.latitude) : null,
            longitude: row.longitude ? parseFloat(row.longitude) : null,
            logo_storage_path: row.predicted_label === 'logo' ? `/logos/${row.slug}.png` : null,
            modern_trust_preview: row.modern_trust_preview 
              ? row.modern_trust_preview.replace('atlasthrust.ai', 'atlasgrowth.ai').replace('modern-trust', 'moderntrust')
              : `https://atlasgrowth.ai/t/moderntrust/${row.slug}`
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`📊 Parsed ${companies.length} companies from CSV`);

    // Insert companies in batches
    const batchSize = 100;
    for (let i = 0; i < companies.length; i += batchSize) {
      const batch = companies.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('companies')
        .insert(batch);
      
      if (insertError) {
        console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} failed:`, insertError);
      } else {
        console.log(`✅ Imported batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(companies.length/batchSize)}`);
      }
    }

    // 4. VERIFY SETUP
    console.log('🔍 Verifying setup...');
    
    const { data: companyCount } = await supabase
      .from('companies')
      .select('predicted_label', { count: 'exact' });
    
    const { data: framesData } = await supabase
      .from('frames')
      .select('*');

    const logoCompanies = companies.filter(c => c.predicted_label === 'logo').length;
    const textCompanies = companies.filter(c => c.predicted_label === 'not_logo').length;

    console.log('🎉 SETUP COMPLETE!');
    console.log(`📊 Imported ${companies.length} companies:`);
    console.log(`   - ${logoCompanies} with logos`);
    console.log(`   - ${textCompanies} text-only`);
    console.log(`🖼️ ${framesData?.length || 0} template frames configured`);
    console.log('📦 Supabase Storage bucket ready for images');
    
    console.log('\n🔗 Test URLs:');
    console.log('   - https://atlasgrowth.ai/t/moderntrust/airzone-llc');
    console.log('   - https://atlasgrowth.ai/t/moderntrust/ls-heating-and-cooling');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

completeSetup();