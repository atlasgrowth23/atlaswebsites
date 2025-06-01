const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixTemplateImages() {
  console.log('🔧 Fixing template image issues...');

  try {
    // 1. ADD MISSING FRAMES
    console.log('📝 Adding missing frames...');
    
    const { error: framesError } = await supabase
      .from('frames')
      .upsert([
        {
          slug: 'hero_img',
          template_key: 'moderntrust',
          default_url: '/storage/templates/moderntrust/hero.jpg',
          description: 'ModernTrust hero image'
        },
        {
          slug: 'hero_img_2', // ADD THIS MISSING ONE
          template_key: 'moderntrust', 
          default_url: '/storage/templates/moderntrust/about.jpg', // Reuse about image for now
          description: 'ModernTrust second hero image'
        },
        {
          slug: 'about_img',
          template_key: 'moderntrust',
          default_url: '/storage/templates/moderntrust/about.jpg',
          description: 'ModernTrust about image'
        },
        {
          slug: 'logo_url',
          template_key: 'moderntrust',
          default_url: '/storage/templates/moderntrust/default-logo.svg',
          description: 'ModernTrust default logo'
        }
      ]);

    if (framesError) {
      console.error('❌ Frames error:', framesError);
    } else {
      console.log('✅ Frames updated');
    }

    // 2. CHECK STORAGE URLS
    console.log('🔍 Checking storage URLs...');
    
    const testPaths = [
      '/templates/moderntrust/hero.jpg',
      '/templates/moderntrust/about.jpg'
    ];

    for (const path of testPaths) {
      const { data, error } = await supabase.storage
        .from('images')
        .getPublicUrl(path);
      
      if (error) {
        console.error(`❌ Error getting URL for ${path}:`, error);
      } else {
        console.log(`✅ ${path} -> ${data.publicUrl}`);
      }
    }

    // 3. TEST TEMPLATE FRAME LOADING
    console.log('🧪 Testing frame loading...');
    
    const { data: frames } = await supabase
      .from('frames')
      .select('*')
      .eq('template_key', 'moderntrust');

    console.log('📋 Available frames:');
    frames?.forEach(frame => {
      const fullUrl = frame.default_url.startsWith('http') 
        ? frame.default_url 
        : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images${frame.default_url}`;
      console.log(`  - ${frame.slug}: ${fullUrl}`);
    });

    console.log('✅ Template image fix complete!');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

fixTemplateImages();