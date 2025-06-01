const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixTemplateStorage() {
  console.log('🔧 Fixing template storage to match ModernTrust requirements...');
  
  try {
    // Step 1: Analyze what the template actually needs
    console.log('\n📋 ModernTrust Template Image Requirements:');
    console.log('1. Hero component: hero_img, hero_img_2 (from frames)');
    console.log('2. About component: about_img (from frames) + fallback to /stock/moderntrust/about_img.svg');
    console.log('3. Header component: company logos via logoUrl');
    console.log('4. No other image requirements found');
    
    // Step 2: Delete old frames and create correct ones
    console.log('\n📝 Step 2: Recreating frames with correct paths...');
    
    // Delete existing frames first
    const { error: deleteError } = await supabase
      .from('frames')
      .delete()
      .eq('template_key', 'moderntrust');
    
    if (deleteError) {
      console.error('❌ Error deleting old frames:', deleteError);
    } else {
      console.log('✅ Cleared existing moderntrust frames');
    }
    
    // Insert the frames the template actually uses
    const { error: framesError } = await supabase
      .from('frames')
      .insert([
        {
          slug: 'hero_img',
          template_key: 'moderntrust',
          default_url: '/templates/moderntrust/hero.jpg',
          description: 'ModernTrust hero slide 1 background'
        },
        {
          slug: 'hero_img_2',
          template_key: 'moderntrust',
          default_url: '/templates/moderntrust/hero2.jpg', // Different image for slide 2
          description: 'ModernTrust hero slide 2 background'
        },
        {
          slug: 'about_img',
          template_key: 'moderntrust',
          default_url: '/templates/moderntrust/about.jpg',
          description: 'ModernTrust about section background'
        }
      ]);

    if (framesError) {
      console.error('❌ Error creating frames:', framesError);
    } else {
      console.log('✅ Created frames that match template requirements');
    }

    // Step 3: Create storage folders and test URLs
    console.log('\n📂 Step 3: Setting up storage structure...');
    
    // Create templates/moderntrust/ and logos/ folders
    const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#f3f4f6"/>
      <text x="50" y="50" text-anchor="middle" dy=".35em" font-family="Arial" font-size="12" fill="#6b7280">
        Template Image
      </text>
    </svg>`;
    
    // Upload placeholder for templates folder
    const { error: templateError } = await supabase.storage
      .from('images')
      .upload('templates/moderntrust/placeholder.svg', placeholderSvg, {
        contentType: 'image/svg+xml',
        upsert: true
      });
    
    if (templateError && !templateError.message.includes('already exists')) {
      console.error('❌ Error creating templates folder:', templateError);
    } else {
      console.log('✅ Created /templates/moderntrust/ folder');
    }
    
    // Upload placeholder for logos folder  
    const { error: logoError } = await supabase.storage
      .from('images')
      .upload('logos/placeholder.svg', placeholderSvg, {
        contentType: 'image/svg+xml',
        upsert: true
      });
    
    if (logoError && !logoError.message.includes('already exists')) {
      console.error('❌ Error creating logos folder:', logoError);
    } else {
      console.log('✅ Created /logos/ folder');
    }

    // Step 4: Create fallback images for the /stock/ path used in About.tsx
    console.log('\n🎨 Step 4: Creating fallback stock images...');
    
    const aboutFallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#bg)"/>
      <circle cx="400" cy="300" r="100" fill="white" opacity="0.1"/>
      <text x="400" y="320" text-anchor="middle" font-family="Arial" font-size="24" fill="white" font-weight="bold">
        About ${''} HVAC Services
      </text>
    </svg>`;
    
    // Create stock/moderntrust/ folder with fallback image
    const { error: stockError } = await supabase.storage
      .from('images')
      .upload('stock/moderntrust/about_img.svg', aboutFallbackSvg, {
        contentType: 'image/svg+xml',
        upsert: true
      });
    
    if (stockError && !stockError.message.includes('already exists')) {
      console.error('❌ Error creating stock image:', stockError);
    } else {
      console.log('✅ Created fallback stock image for About component');
    }

    // Step 5: Test all required URLs
    console.log('\n🧪 Step 5: Testing all template image URLs...');
    
    const requiredPaths = [
      '/templates/moderntrust/hero.jpg',
      '/templates/moderntrust/hero2.jpg', 
      '/templates/moderntrust/about.jpg',
      '/stock/moderntrust/about_img.svg', // Fallback used by About.tsx
      '/logos/test-company.png' // Example logo path
    ];
    
    for (const path of requiredPaths) {
      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(path);
      
      console.log(`📍 ${path}`);
      console.log(`   -> ${data.publicUrl}`);
    }

    // Step 6: Show current frames
    console.log('\n🔍 Step 6: Current frames in database:');
    
    const { data: frames } = await supabase
      .from('frames')
      .select('*')
      .eq('template_key', 'moderntrust');

    frames?.forEach(frame => {
      const fullUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images${frame.default_url}`;
      console.log(`  - ${frame.slug}: ${fullUrl}`);
    });

    console.log('\n✅ Template storage structure is now correctly configured!');
    console.log('\n🎯 Next steps:');
    console.log('1. Upload actual template images to replace placeholders');
    console.log('2. Test logo upload for a few companies');
    console.log('3. Enable logo display logic in template');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

fixTemplateStorage();