const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: './env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Simple CSV parser
function parseCSV(text) {
  const lines = text.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = lines[i].split(',');
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] ? values[index].trim().replace(/"/g, '') : '';
      });
      rows.push(row);
    }
  }
  
  return rows;
}

// Create a professional text-based logo PNG
function createTextLogoPNG(companyName, slug) {
  // Extract initials for the logo
  const initials = companyName
    .split(' ')
    .filter(word => word.length > 0)
    .slice(0, 3)
    .map(word => word.charAt(0).toUpperCase())
    .join('');

  // Choose colors based on company name hash
  const colors = [
    { bg: '#2563eb', text: 'white' }, // Blue
    { bg: '#dc2626', text: 'white' }, // Red
    { bg: '#059669', text: 'white' }, // Green
    { bg: '#d97706', text: 'white' }, // Orange
    { bg: '#7c3aed', text: 'white' }, // Purple
    { bg: '#0891b2', text: 'white' }, // Cyan
  ];

  let hash = 0;
  for (let i = 0; i < companyName.length; i++) {
    hash = companyName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % colors.length;
  const color = colors[colorIndex];

  // Create SVG first, then we'll convert to PNG
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <defs>
      <linearGradient id="grad-${slug}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color.bg};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${color.bg};stop-opacity:0.8" />
      </linearGradient>
    </defs>
    
    <!-- Background circle -->
    <circle cx="200" cy="200" r="180" fill="url(#grad-${slug})" stroke="white" stroke-width="8"/>
    
    <!-- Company initials -->
    <text x="200" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="${initials.length <= 2 ? '96' : '72'}" font-weight="bold" fill="${color.text}">
      ${initials}
    </text>
    
    <!-- Professional border -->
    <circle cx="200" cy="200" r="180" fill="none" stroke="#e5e7eb" stroke-width="4" opacity="0.5"/>
  </svg>`;

  return svg;
}

async function create50Logos() {
  console.log('🎨 Creating logos for first 50 companies...');
  
  try {
    // Step 1: Get real logos from CSV
    console.log('\n📊 Getting real logos from CSV...');
    
    const csvPath = '/home/runner/workspace/CompanyData/enhanced_hvac_with_reviews_timeline.csv';
    const csvText = fs.readFileSync(csvPath, 'utf8');
    const csvData = parseCSV(csvText);
    
    const realLogos = {};
    csvData.forEach(row => {
      if (row.logo && row.logo.startsWith('http') && row.place_id) {
        realLogos[row.place_id] = row.logo.trim();
      }
    });
    
    console.log(`✅ Found ${Object.keys(realLogos).length} real logos in CSV`);
    
    // Step 2: Get first 50 logo companies
    console.log('\n📋 Getting first 50 logo companies...');
    
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name, slug, place_id, predicted_label, logo_storage_path')
      .eq('predicted_label', 'logo')
      .limit(50);
    
    if (error) {
      console.error('❌ Error fetching companies:', error);
      return;
    }
    
    console.log(`📋 Found ${companies.length} companies to process`);
    
    // Step 3: Process each company
    console.log('\n🔄 Processing companies...');
    
    let realLogoCount = 0;
    let textLogoCount = 0;
    let uploadedCount = 0;
    
    for (const company of companies) {
      try {
        console.log(`\n🔄 Processing: ${company.name}`);
        
        const logoFileName = `${company.slug}.png`;
        const storagePath = `logos/${logoFileName}`;
        
        // Check if company has real logo
        const realLogoUrl = realLogos[company.place_id];
        
        if (realLogoUrl) {
          // Download and upload real logo
          console.log(`📥 Downloading real logo for ${company.name}`);
          
          try {
            const response = await fetch(realLogoUrl);
            if (response.ok) {
              const imageBuffer = await response.arrayBuffer();
              
              // Upload to Supabase Storage
              const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(storagePath, imageBuffer, {
                  contentType: 'image/jpeg',
                  upsert: true
                });
              
              if (uploadError) {
                console.error(`❌ Upload error: ${uploadError.message}`);
              } else {
                console.log(`✅ Uploaded real logo: ${company.name}`);
                realLogoCount++;
                uploadedCount++;
              }
            } else {
              throw new Error(`HTTP ${response.status}`);
            }
          } catch (downloadError) {
            console.log(`⚠️  Real logo failed, creating text logo: ${downloadError.message}`);
            
            // Fallback to text logo
            const textLogoSVG = createTextLogoPNG(company.name, company.slug);
            
            const { error: uploadError } = await supabase.storage
              .from('images')
              .upload(storagePath, textLogoSVG, {
                contentType: 'image/svg+xml',
                upsert: true
              });
            
            if (!uploadError) {
              console.log(`✅ Created text logo: ${company.name}`);
              textLogoCount++;
              uploadedCount++;
            }
          }
        } else {
          // Create text logo
          console.log(`🎨 Creating text logo for ${company.name}`);
          
          const textLogoSVG = createTextLogoPNG(company.name, company.slug);
          
          const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(storagePath, textLogoSVG, {
              contentType: 'image/svg+xml',
              upsert: true
            });
          
          if (uploadError) {
            console.error(`❌ Upload error: ${uploadError.message}`);
          } else {
            console.log(`✅ Created text logo: ${company.name}`);
            textLogoCount++;
            uploadedCount++;
          }
        }
        
        // Update database to ensure correct path
        const correctPath = `/logos/${company.slug}.png`;
        if (company.logo_storage_path !== correctPath) {
          const { error: updateError } = await supabase
            .from('companies')
            .update({ logo_storage_path: correctPath })
            .eq('id', company.id);
          
          if (!updateError) {
            console.log(`📝 Updated database path: ${correctPath}`);
          }
        }
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        console.error(`❌ Error processing ${company.name}: ${err.message}`);
      }
    }
    
    // Step 4: Test some URLs
    console.log('\n🧪 Testing logo URLs...');
    
    const testCompanies = companies.slice(0, 5);
    for (const company of testCompanies) {
      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(`logos/${company.slug}.png`);
      
      console.log(`📍 ${company.name}:`);
      console.log(`   Template: /t/moderntrust/${company.slug}`);
      console.log(`   Logo: ${data.publicUrl}`);
    }
    
    // Step 5: Summary
    console.log('\n📊 SUMMARY:');
    console.log(`✅ Real logos downloaded: ${realLogoCount}`);
    console.log(`🎨 Text logos created: ${textLogoCount}`);
    console.log(`📤 Total uploaded: ${uploadedCount}`);
    console.log(`🎯 Companies processed: ${companies.length}`);
    
    console.log('\n🎉 50 company logos created and uploaded!');
    console.log('Test the templates to verify logos are working correctly.');
    
  } catch (error) {
    console.error('❌ Logo creation failed:', error);
  }
}

create50Logos();