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

// Clean logo URL - remove size parameters and make high-res
function cleanLogoUrl(logoUrl) {
  if (!logoUrl || !logoUrl.includes('googleusercontent.com')) {
    return logoUrl;
  }
  
  // Replace s512 with s400 for high resolution
  return logoUrl.replace(/\/s\d+\/photo\.jpg/, '/s400-p-k-no-ns-nd/photo.jpg');
}

async function mapLogoDataCsv() {
  console.log('🔥 MAPPING THE HOLY GRAIL Logo_Data.csv!!!');
  
  try {
    // Step 1: Read the Logo_Data.csv file
    console.log('\n📊 Reading Logo_Data.csv...');
    
    const csvPath = '/home/runner/workspace/combined_alabama_arkansas_fixed_r365 - Logo_Data.csv';
    const csvText = fs.readFileSync(csvPath, 'utf8');
    const logoData = parseCSV(csvText);
    
    console.log(`📋 Found ${logoData.length} companies with logo URLs in Logo_Data.csv`);
    
    // Build place_id -> logo URL map
    const logoMap = {};
    let validLogos = 0;
    
    logoData.forEach(row => {
      if (row['Place ID'] && row['Logo URL'] && row['Logo URL'].startsWith('http')) {
        logoMap[row['Place ID']] = {
          businessName: row['Business Name'],
          originalUrl: row['Logo URL'],
          cleanedUrl: cleanLogoUrl(row['Logo URL']),
          predictedLabel: row['Predicted Label']
        };
        validLogos++;
      }
    });
    
    console.log(`✅ Found ${validLogos} valid logo URLs to map`);
    
    // Show first 5 examples
    console.log('\n📋 First 5 logo URLs from CSV:');
    Object.values(logoMap).slice(0, 5).forEach((logo, index) => {
      console.log(`${index + 1}. ${logo.businessName}`);
      console.log(`   Original: ${logo.originalUrl}`);
      console.log(`   Cleaned:  ${logo.cleanedUrl}`);
    });
    
    // Step 2: Get ALL companies with predicted_label='logo' that don't have logo URLs
    console.log('\n🗄️  Getting companies that need logos...');
    
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name, slug, place_id, predicted_label, logo_storage_path')
      .eq('predicted_label', 'logo')
      .or('logo_storage_path.is.null,logo_storage_path.eq.');
    
    if (error) {
      console.error('❌ Error fetching companies:', error);
      return;
    }
    
    console.log(`📋 Found ${companies.length} companies that need logos`);
    
    // Step 3: Match by place_id and update database
    console.log('\n🔗 Matching by place_id and updating database...');
    
    let matched = 0;
    let updated = 0;
    let noMatch = 0;
    const matchedCompanies = [];
    
    for (const company of companies) {
      try {
        const logoInfo = logoMap[company.place_id];
        
        if (logoInfo) {
          console.log(`\n✅ MATCH: ${company.name}`);
          console.log(`   CSV Name: ${logoInfo.businessName}`);
          console.log(`   Original: ${logoInfo.originalUrl}`);
          console.log(`   Cleaned:  ${logoInfo.cleanedUrl}`);
          
          // Update database with cleaned logo URL
          const { error: updateError } = await supabase
            .from('companies')
            .update({
              logo_storage_path: logoInfo.cleanedUrl
            })
            .eq('id', company.id);
          
          if (updateError) {
            console.error(`❌ Update error: ${updateError.message}`);
          } else {
            console.log(`✅ Updated database with logo URL`);
            updated++;
            matchedCompanies.push({
              name: company.name,
              slug: company.slug,
              logoUrl: logoInfo.cleanedUrl,
              csvName: logoInfo.businessName
            });
          }
          
          matched++;
        } else {
          noMatch++;
        }
        
      } catch (err) {
        console.error(`❌ Error processing ${company.name}: ${err.message}`);
      }
    }
    
    // Step 4: Show test URLs
    console.log('\n🧪 Companies with newly mapped logos:');
    
    matchedCompanies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name}:`);
      console.log(`   Template: /t/moderntrust/${company.slug}`);
      console.log(`   Logo URL: ${company.logoUrl}`);
      console.log(`   CSV Name: ${company.csvName}`);
    });
    
    // Step 5: Final summary
    console.log('\n📊 LOGO_DATA.CSV MAPPING SUMMARY:');
    console.log(`📁 Logo URLs in Logo_Data.csv: ${validLogos}`);
    console.log(`🏢 Companies processed: ${companies.length}`);
    console.log(`✅ Successful matches: ${matched}`);
    console.log(`📝 Database updates: ${updated}`);
    console.log(`❌ No matches: ${noMatch}`);
    
    // Get final count of companies with logos
    const { data: finalCount } = await supabase
      .from('companies')
      .select('id')
      .eq('predicted_label', 'logo')
      .not('logo_storage_path', 'is', null)
      .neq('logo_storage_path', '');
    
    console.log(`\n🎉 LOGO_DATA.CSV MAPPING COMPLETE!`);
    console.log(`✅ Mapped ${updated} additional logo URLs`);
    console.log(`🔥 TOTAL companies now with real logos: ${finalCount?.length || 0}`);
    console.log(`🚀 This Logo_Data.csv was EXACTLY what we needed!`);
    
  } catch (error) {
    console.error('❌ Logo_Data.csv mapping failed:', error);
  }
}

mapLogoDataCsv();