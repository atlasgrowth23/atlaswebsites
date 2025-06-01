const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixTemplateImagesProperly() {
  console.log('🔧 Fixing template images properly - removing SVGs and using real images...');
  
  try {
    // Step 1: Delete the SVG files I incorrectly created
    console.log('\n🗑️  Deleting incorrect SVG files...');
    
    const filesToDelete = [
      'templates/moderntrust/hero.svg',
      'templates/moderntrust/hero2.svg', 
      'templates/moderntrust/about.svg',
      'templates/moderntrust/placeholder.svg',
      'logos/placeholder.svg',
      'stock/moderntrust/about_img.svg'
    ];
    
    for (const file of filesToDelete) {
      const { error } = await supabase.storage
        .from('images')
        .remove([file]);
      
      if (error && !error.message.includes('not found')) {
        console.error(`❌ Error deleting ${file}:`, error);
      } else {
        console.log(`✅ Deleted ${file}`);
      }
    }
    
    // Step 2: Update frames to use the existing JPG files that should be there
    console.log('\n📝 Updating frames to use proper JPG paths...');
    
    const { error: deleteFramesError } = await supabase
      .from('frames')
      .delete()
      .eq('template_key', 'moderntrust');
    
    if (deleteFramesError) {
      console.error('❌ Error deleting frames:', deleteFramesError);
    }
    
    // Create simple, correct frames pointing to where images should be
    const { error: framesError } = await supabase
      .from('frames')
      .insert([
        {
          slug: 'hero_img',
          template_key: 'moderntrust',
          default_url: '/templates/moderntrust/hero.jpg',
          description: 'ModernTrust hero background'
        },
        {
          slug: 'hero_img_2',
          template_key: 'moderntrust',
          default_url: '/templates/moderntrust/hero.jpg', // Same image for both slides for now
          description: 'ModernTrust hero background 2'
        },
        {
          slug: 'about_img',
          template_key: 'moderntrust',
          default_url: '/templates/moderntrust/about.jpg',
          description: 'ModernTrust about background'
        }
      ]);

    if (framesError) {
      console.error('❌ Error creating frames:', framesError);
    } else {
      console.log('✅ Created proper frames pointing to JPG files');
    }
    
    // Step 3: Check what images we actually need to upload
    console.log('\n📋 Required template images:');
    console.log('- /templates/moderntrust/hero.jpg (for hero background)');
    console.log('- /templates/moderntrust/about.jpg (for about section)');
    console.log('- Company logos: /logos/{slug}.png (as originally planned)');
    
    // Step 4: Test the URLs
    console.log('\n🧪 Template image URLs (need to upload these):');
    const requiredImages = [
      '/templates/moderntrust/hero.jpg',
      '/templates/moderntrust/about.jpg'
    ];
    
    for (const path of requiredImages) {
      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(path);
      
      console.log(`📍 ${path}`);
      console.log(`   -> ${data.publicUrl}`);
    }
    
    // Step 5: Show current frames
    console.log('\n📋 Current frames in database:');
    const { data: frames } = await supabase
      .from('frames')
      .select('*')
      .eq('template_key', 'moderntrust');

    frames?.forEach(frame => {
      const fullUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images${frame.default_url}`;
      console.log(`  - ${frame.slug}: ${fullUrl}`);
    });
    
    console.log('\n✅ Fixed! Now you need to:');
    console.log('1. Upload hero.jpg and about.jpg to /templates/moderntrust/');
    console.log('2. Upload company logos as .png files to /logos/{slug}.png');
    console.log('3. Remove any SVG confusion - everything is JPG/PNG as planned');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

fixTemplateImagesProperly();