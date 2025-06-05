const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: 'env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixStorage() {
  console.log('🚀 Fixing storage and frames...');

  try {
    // 1. Upload missing hero2 image
    const hero2Path = path.join(__dirname, '..', 'public', 'images', 'hvac-hero-bg.svg');
    const hero2File = fs.readFileSync(hero2Path);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload('templates/moderntrust/hero2.svg', hero2File, {
        contentType: 'image/svg+xml',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
    } else {
      console.log('✅ Uploaded hero2.svg to storage');
    }

    // 2. Update frames table with proper storage URLs
    const storageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images`;
    
    const frameUpdates = [
      { slug: 'hero_img', default_url: `${storageUrl}/templates/moderntrust/hero.jpg` },
      { slug: 'hero_img_2', default_url: `${storageUrl}/templates/moderntrust/hero2.svg` },
      { slug: 'about_img', default_url: `${storageUrl}/templates/moderntrust/about.jpg` }
    ];

    for (const frame of frameUpdates) {
      const { error } = await supabase
        .from('frames')
        .update({ default_url: frame.default_url })
        .eq('slug', frame.slug)
        .eq('template_key', 'moderntrust');

      if (error) {
        console.error(`❌ Frame update error for ${frame.slug}:`, error);
      } else {
        console.log(`✅ Updated frame: ${frame.slug}`);
      }
    }

    console.log('🎉 Storage fix complete!');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

fixStorage();