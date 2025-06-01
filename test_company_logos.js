const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCompanyLogos() {
  console.log('🏢 Testing logo upload for 10 companies...');
  
  try {
    // Get first 10 companies with predicted_label='logo'
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name, slug, predicted_label, logo_storage_path, city, state')
      .eq('predicted_label', 'logo')
      .limit(10);
    
    if (error) {
      console.error('❌ Error fetching companies:', error);
      return;
    }
    
    console.log(`📊 Found ${companies?.length || 0} companies to test with logos`);
    
    if (!companies || companies.length === 0) {
      console.log('❌ No companies with predicted_label="logo" found');
      return;
    }
    
    // Generate simple logos for each company
    for (const company of companies) {
      try {
        console.log(`🎨 Creating logo for: ${company.name} (${company.city}, ${company.state})`);
        
        // Create a simple professional logo SVG
        const logoSvg = createCompanyLogo(company);
        
        // Upload to storage
        const logoPath = `logos/${company.slug}.svg`;
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(logoPath, logoSvg, {
            contentType: 'image/svg+xml',
            upsert: true
          });
        
        if (uploadError) {
          console.error(`❌ Upload error for ${company.name}:`, uploadError);
        } else {
          console.log(`✅ Uploaded: ${logoPath}`);
          
          // Update logo_storage_path to use SVG instead of PNG
          const { error: updateError } = await supabase
            .from('companies')
            .update({ logo_storage_path: `/${logoPath}` })
            .eq('id', company.id);
          
          if (updateError) {
            console.error(`❌ Database update error for ${company.name}:`, updateError);
          } else {
            console.log(`✅ Updated database path for ${company.name}`);
          }
        }
        
      } catch (err) {
        console.error(`❌ Error processing ${company.name}:`, err.message);
      }
    }
    
    // Test logo URLs
    console.log('\n🧪 Testing logo URLs:');
    for (const company of companies) {
      const logoPath = `/logos/${company.slug}.svg`;
      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(logoPath);
      
      console.log(`📍 ${company.name}: ${data.publicUrl}`);
    }
    
    console.log('\n✅ Logo test complete! Ready to enable logo display logic.');
    
  } catch (error) {
    console.error('❌ Logo test failed:', error);
  }
}

function createCompanyLogo(company) {
  // Extract initials from company name
  const initials = company.name
    .split(' ')
    .filter(word => word.length > 0)
    .slice(0, 3) // Max 3 words
    .map(word => word.charAt(0).toUpperCase())
    .join('');
  
  // Choose colors based on company name hash (consistent colors)
  const colors = [
    { bg: '#3b82f6', text: 'white' }, // Blue
    { bg: '#ef4444', text: 'white' }, // Red
    { bg: '#10b981', text: 'white' }, // Green
    { bg: '#f59e0b', text: 'white' }, // Amber
    { bg: '#8b5cf6', text: 'white' }, // Purple
    { bg: '#06b6d4', text: 'white' }, // Cyan
  ];
  
  // Simple hash for consistent color selection
  let hash = 0;
  for (let i = 0; i < company.name.length; i++) {
    hash = company.name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % colors.length;
  const color = colors[colorIndex];
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <defs>
      <linearGradient id="grad-${company.slug}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color.bg};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${color.bg};stop-opacity:0.8" />
      </linearGradient>
    </defs>
    
    <!-- Background circle -->
    <circle cx="100" cy="100" r="90" fill="url(#grad-${company.slug})" stroke="white" stroke-width="6"/>
    
    <!-- Company initials -->
    <text x="100" y="110" text-anchor="middle" font-family="Arial, sans-serif" font-size="${initials.length <= 2 ? '48' : '36'}" font-weight="bold" fill="${color.text}">
      ${initials}
    </text>
    
    <!-- Professional border -->
    <circle cx="100" cy="100" r="90" fill="none" stroke="#e5e7eb" stroke-width="2" opacity="0.5"/>
    
    <!-- Subtle HVAC element -->
    <g transform="translate(160, 40)" opacity="0.3" fill="${color.text}">
      <rect x="0" y="0" width="20" height="15" rx="2"/>
      <rect x="5" y="5" width="10" height="5" rx="1"/>
    </g>
  </svg>`;
}

testCompanyLogos();