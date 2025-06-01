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

// Convert Google logo URL to high-res version
function getHighResLogoUrl(logoUrl) {
  if (!logoUrl || !logoUrl.includes('googleusercontent.com')) {
    return null;
  }
  
  // Replace the size parameter with s400 for high resolution
  const highResUrl = logoUrl.replace(/\/s\d+-[^/]+\/photo\.jpg/, '/s400-p-k-no-ns-nd/photo.jpg');
  return highResUrl;
}

// Create text logo as fallback
function createTextLogo(companyName, slug) {
  const initials = companyName
    .split(' ')
    .filter(word => word.length > 0)
    .slice(0, 3)
    .map(word => word.charAt(0).toUpperCase())
    .join('');

  const colors = [
    { bg: '#2563eb', text: 'white' },
    { bg: '#dc2626', text: 'white' },
    { bg: '#059669', text: 'white' },
    { bg: '#d97706', text: 'white' },
    { bg: '#7c3aed', text: 'white' },
    { bg: '#0891b2', text: 'white' },
  ];

  let hash = 0;
  for (let i = 0; i < companyName.length; i++) {
    hash = companyName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % colors.length;
  const color = colors[colorIndex];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <defs>
      <linearGradient id="grad-${slug}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color.bg};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${color.bg};stop-opacity:0.8" />
      </linearGradient>
    </defs>
    <circle cx="200" cy="200" r="180" fill="url(#grad-${slug})" stroke="white" stroke-width="8"/>
    <text x="200" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="${initials.length <= 2 ? '96' : '72'}" font-weight="bold" fill="${color.text}">
      ${initials}
    </text>
    <circle cx="200" cy="200" r="180" fill="none" stroke="#e5e7eb" stroke-width="4" opacity="0.5"/>
  </svg>`;
}

async function fix50RealLogos() {
  console.log('🔧 Fixing 50 companies with REAL logos from correct CSV...');
  
  try {
    // Step 1: Read the CORRECT CSV file
    console.log('\n📊 Reading CompanyData/combined_filtered_hvac.csv...');
    
    const csvPath = '/home/runner/workspace/CompanyData/combined_filtered_hvac.csv';
    const csvText = fs.readFileSync(csvPath, 'utf8');
    const csvData = parseCSV(csvText);
    
    // Get companies with real logos from this CSV
    const realLogos = {};
    let csvLogoCount = 0;
    
    csvData.forEach(row => {
      if (row.logo && row.logo.startsWith('http') && row.place_id) {
        realLogos[row.place_id] = {
          originalUrl: row.logo.trim(),
          highResUrl: getHighResLogoUrl(row.logo.trim()),
          name: row.name
        };
        csvLogoCount++;
      }
    });
    
    console.log(`✅ Found ${csvLogoCount} companies with real logos in combined_filtered_hvac.csv`);
    
    // Show first 3 examples
    console.log('\n📋 Examples from CSV:');
    Object.values(realLogos).slice(0, 3).forEach((logo, index) => {
      console.log(`${index + 1}. ${logo.name}:`);
      console.log(`   Original: ${logo.originalUrl}`);
      console.log(`   High-res: ${logo.highResUrl}`);
    });
    
    // Step 2: Get the same 50 companies I processed before
    console.log('\n🎯 Getting the same 50 companies to fix...');
    
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name, slug, place_id, predicted_label, logo_storage_path')
      .eq('predicted_label', 'logo')
      .limit(50);
    
    if (error) {
      console.error('❌ Error fetching companies:', error);
      return;
    }
    
    console.log(`📋 Found ${companies.length} companies to fix`);
    
    // Step 3: Process each company with REAL logos
    console.log('\n🔄 Processing companies with real logos...');
    
    let realDownloaded = 0;
    let textCreated = 0;
    let totalProcessed = 0;
    
    for (const company of companies) {
      try {
        console.log(`\n🔄 Processing: ${company.name}`);
        
        const logoFileName = `${company.slug}.png`;
        const storagePath = `logos/${logoFileName}`;
        
        // Check if this company has a real logo in CSV
        const realLogoData = realLogos[company.place_id];
        
        if (realLogoData && realLogoData.highResUrl) {
          // Download REAL high-res logo
          console.log(`📥 Downloading REAL logo: ${realLogoData.highResUrl}`);
          
          try {
            const response = await fetch(realLogoData.highResUrl);
            if (response.ok) {
              const imageBuffer = await response.arrayBuffer();
              
              // Delete old file first
              await supabase.storage
                .from('images')
                .remove([storagePath]);
              
              // Upload real logo
              const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(storagePath, imageBuffer, {
                  contentType: 'image/jpeg',
                  upsert: true
                });
              
              if (uploadError) {
                console.error(`❌ Upload error: ${uploadError.message}`);
              } else {
                console.log(`✅ REAL logo uploaded: ${company.name}`);
                realDownloaded++;
                totalProcessed++;
              }
            } else {
              throw new Error(`HTTP ${response.status}`);
            }
          } catch (downloadError) {
            console.log(`⚠️  Real logo download failed: ${downloadError.message}`);
            console.log(`🎨 Creating text logo as fallback...`);
            
            // Fallback to text logo
            const textLogoSVG = createTextLogo(company.name, company.slug);
            
            // Delete old file first
            await supabase.storage
              .from('images')
              .remove([storagePath]);
            
            const { error: uploadError } = await supabase.storage
              .from('images')
              .upload(storagePath, textLogoSVG, {
                contentType: 'image/svg+xml',
                upsert: true
              });
            
            if (!uploadError) {
              console.log(`✅ Text logo created: ${company.name}`);
              textCreated++;
              totalProcessed++;
            }
          }
        } else {
          // No real logo available, create text logo
          console.log(`🎨 No real logo available, creating text logo...`);
          
          const textLogoSVG = createTextLogo(company.name, company.slug);
          
          // Delete old file first
          await supabase.storage
            .from('images')
            .remove([storagePath]);
          
          const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(storagePath, textLogoSVG, {
              contentType: 'image/svg+xml',
              upsert: true
            });
          
          if (uploadError) {
            console.error(`❌ Upload error: ${uploadError.message}`);
          } else {
            console.log(`✅ Text logo created: ${company.name}`);
            textCreated++;
            totalProcessed++;
          }
        }
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        console.error(`❌ Error processing ${company.name}: ${err.message}`);
      }
    }
    
    // Step 4: Test URLs
    console.log('\n🧪 Testing fixed logo URLs...');
    
    const testCompanies = companies.slice(0, 5);
    for (const company of testCompanies) {
      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(`logos/${company.slug}.png`);
      
      const hasRealLogo = realLogos[company.place_id] ? '🖼️  REAL' : '🎨 TEXT';
      
      console.log(`📍 ${company.name} ${hasRealLogo}:`);
      console.log(`   Template: /t/moderntrust/${company.slug}`);
      console.log(`   Logo: ${data.publicUrl}`);
    }
    
    // Step 5: Summary
    console.log('\n📊 FIXED SUMMARY:');
    console.log(`🖼️  Real logos downloaded: ${realDownloaded}`);
    console.log(`🎨 Text logos created: ${textCreated}`);
    console.log(`📤 Total processed: ${totalProcessed}`);
    console.log(`📁 Available real logos in CSV: ${csvLogoCount}`);
    
    console.log('\n🎉 50 companies FIXED with correct logos!');
    console.log('Now test the templates - real logos should be high quality!');
    
  } catch (error) {
    console.error('❌ Fix process failed:', error);
  }
}

fix50RealLogos();