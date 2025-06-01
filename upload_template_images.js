const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function uploadTemplateImages() {
  console.log('🎨 Creating and uploading template images...');
  
  try {
    // Create hero background SVG (professional HVAC theme)
    const heroImageSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1e40af;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#3b82f6;stop-opacity:0.9" />
          <stop offset="100%" style="stop-color:#60a5fa;stop-opacity:0.8" />
        </linearGradient>
        <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
          <path d="M 100 0 L 0 0 0 100" fill="none" stroke="white" stroke-width="1" opacity="0.1"/>
        </pattern>
      </defs>
      <rect width="1920" height="1080" fill="url(#heroGrad)"/>
      <rect width="1920" height="1080" fill="url(#grid)"/>
      
      <!-- HVAC Equipment Silhouettes -->
      <g transform="translate(1400, 200)" opacity="0.1" fill="white">
        <!-- AC Unit -->
        <rect x="0" y="0" width="300" height="200" rx="20"/>
        <rect x="50" y="50" width="200" height="100" rx="10"/>
        <circle cx="300" cy="100" r="80" fill="none" stroke="white" stroke-width="8"/>
      </g>
      
      <g transform="translate(200, 600)" opacity="0.08" fill="white">
        <!-- Furnace -->
        <rect x="0" y="0" width="200" height="300" rx="15"/>
        <rect x="30" y="50" width="140" height="200" rx="8"/>
        <rect x="60" y="80" width="80" height="20"/>
        <rect x="60" y="120" width="80" height="20"/>
        <rect x="60" y="160" width="80" height="20"/>
      </g>
      
      <!-- Professional Text Overlay -->
      <text x="960" y="450" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" opacity="0.15">
        PROFESSIONAL HVAC SERVICES
      </text>
      <text x="960" y="520" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="normal" fill="white" opacity="0.1">
        Heating • Cooling • Maintenance • Repair
      </text>
    </svg>`;
    
    // Create hero slide 2 SVG (different theme - warmer colors)
    const hero2ImageSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="hero2Grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#dc2626;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#ef4444;stop-opacity:0.9" />
          <stop offset="100%" style="stop-color:#f87171;stop-opacity:0.8" />
        </linearGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#hero2Grad)"/>
      
      <!-- Warm/Heating Theme Elements -->
      <g transform="translate(1300, 300)" opacity="0.1" fill="white">
        <!-- Flame shapes -->
        <path d="M50,200 Q100,100 150,200 Q100,150 50,200" />
        <path d="M200,200 Q250,80 300,200 Q250,140 200,200" />
        <path d="M350,200 Q400,120 450,200 Q400,160 350,200" />
      </g>
      
      <text x="960" y="450" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" opacity="0.15">
        EXPERT HVAC TECHNICIANS
      </text>
      <text x="960" y="520" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="normal" fill="white" opacity="0.1">
        Licensed • Insured • 24/7 Emergency Service
      </text>
    </svg>`;
    
    // Create about section SVG
    const aboutImageSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="aboutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f8fafc;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e2e8f0;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#aboutGrad)"/>
      
      <!-- Professional service icons -->
      <g transform="translate(150, 150)" fill="#3b82f6" opacity="0.8">
        <!-- Wrench icon -->
        <path d="M12 15l4-4 4 4-4 4z M8 21l3-3-3-3-3 3z" stroke="#3b82f6" stroke-width="3" fill="none"/>
        <circle cx="60" cy="40" r="30" fill="none" stroke="#3b82f6" stroke-width="4"/>
      </g>
      
      <g transform="translate(550, 150)" fill="#ef4444" opacity="0.8">
        <!-- Temperature icon -->
        <rect x="20" y="10" width="20" height="60" rx="10" fill="#ef4444"/>
        <circle cx="30" cy="80" r="15" fill="#ef4444"/>
      </g>
      
      <g transform="translate(350, 350)" fill="#10b981" opacity="0.8">
        <!-- Check mark -->
        <path d="M5 13l4 4L19 7" stroke="#10b981" stroke-width="6" fill="none" stroke-linecap="round"/>
      </g>
      
      <text x="400" y="480" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#1f2937">
        Professional Service
      </text>
      <text x="400" y="520" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#6b7280">
        Quality • Reliability • Trust
      </text>
    </svg>`;
    
    // Upload hero image
    console.log('📤 Uploading hero.svg...');
    const { error: heroError } = await supabase.storage
      .from('images')
      .upload('templates/moderntrust/hero.svg', heroImageSvg, {
        contentType: 'image/svg+xml',
        upsert: true
      });
    
    if (heroError) {
      console.error('❌ Hero upload error:', heroError);
    } else {
      console.log('✅ Uploaded hero.svg');
    }
    
    // Upload hero2 image
    console.log('📤 Uploading hero2.svg...');
    const { error: hero2Error } = await supabase.storage
      .from('images')
      .upload('templates/moderntrust/hero2.svg', hero2ImageSvg, {
        contentType: 'image/svg+xml',
        upsert: true
      });
    
    if (hero2Error) {
      console.error('❌ Hero2 upload error:', hero2Error);
    } else {
      console.log('✅ Uploaded hero2.svg');
    }
    
    // Upload about image
    console.log('📤 Uploading about.svg...');
    const { error: aboutError } = await supabase.storage
      .from('images')
      .upload('templates/moderntrust/about.svg', aboutImageSvg, {
        contentType: 'image/svg+xml',
        upsert: true
      });
    
    if (aboutError) {
      console.error('❌ About upload error:', aboutError);
    } else {
      console.log('✅ Uploaded about.svg');
    }
    
    // Update frames to use SVG files instead of JPG
    console.log('📝 Updating frames to use uploaded SVG files...');
    
    const frameUpdates = [
      { slug: 'hero_img', url: '/templates/moderntrust/hero.svg' },
      { slug: 'hero_img_2', url: '/templates/moderntrust/hero2.svg' },
      { slug: 'about_img', url: '/templates/moderntrust/about.svg' }
    ];
    
    for (const frame of frameUpdates) {
      const { error: updateError } = await supabase
        .from('frames')
        .update({ default_url: frame.url })
        .eq('template_key', 'moderntrust')
        .eq('slug', frame.slug);
      
      if (updateError) {
        console.error(`❌ Error updating ${frame.slug}:`, updateError);
      } else {
        console.log(`✅ Updated ${frame.slug} to ${frame.url}`);
      }
    }
    
    // Test final URLs
    console.log('\n🧪 Testing final template image URLs:');
    const testPaths = [
      '/templates/moderntrust/hero.svg',
      '/templates/moderntrust/hero2.svg',
      '/templates/moderntrust/about.svg'
    ];
    
    for (const path of testPaths) {
      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(path);
      
      console.log(`✅ ${path}`);
      console.log(`   -> ${data.publicUrl}`);
    }
    
    console.log('\n🎯 Template images ready! Next: Test with 10 company logos');
    
  } catch (error) {
    console.error('❌ Upload failed:', error);
  }
}

uploadTemplateImages();