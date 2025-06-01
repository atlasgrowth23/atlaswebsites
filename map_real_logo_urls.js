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
    return logoUrl; // Return as-is if not Google URL
  }
  
  // Replace size parameter with high-res version
  return logoUrl.replace(/\/s\d+-[^/]+\/photo\.jpg/, '/s400-p-k-no-ns-nd/photo.jpg');
}

async function mapRealLogoUrls() {
  console.log('🔗 Mapping real logo URLs for 50 companies...');
  
  try {
    // Step 1: Read CSV with logo URLs
    console.log('\n📊 Reading enhanced_hvac_with_reviews_timeline.csv...');
    
    const csvPath = '/home/runner/workspace/CompanyData/enhanced_hvac_with_reviews_timeline.csv';
    const csvText = fs.readFileSync(csvPath, 'utf8');
    const csvData = parseCSV(csvText);
    
    // Build place_id -> logo URL map
    const logoMap = {};
    let csvLogosFound = 0;
    
    csvData.forEach(row => {
      if (row.place_id && row.logo && row.logo.trim() && row.logo !== '{}') {
        logoMap[row.place_id] = {
          originalUrl: row.logo.trim(),
          cleanedUrl: cleanLogoUrl(row.logo.trim()),
          name: row.name
        };
        csvLogosFound++;
      }
    });
    
    console.log(`✅ Found ${csvLogosFound} logo URLs in CSV`);
    
    // Step 2: Get first 50 companies with predicted_label='logo'
    console.log('\n📋 Getting 50 database companies...');
    
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
    
    // Step 3: Match by place_id and update database
    console.log('\n🔗 Matching by place_id and updating database...');
    
    let matched = 0;
    let updated = 0;
    let noMatch = 0;
    
    for (const company of companies) {
      try {
        const logoData = logoMap[company.place_id];
        
        if (logoData) {
          console.log(`\n✅ MATCH: ${company.name}`);
          console.log(`   Original: ${logoData.originalUrl}`);
          console.log(`   Cleaned:  ${logoData.cleanedUrl}`);
          
          // Update database with cleaned logo URL
          const { error: updateError } = await supabase
            .from('companies')
            .update({
              logo_storage_path: logoData.cleanedUrl
            })
            .eq('id', company.id);
          
          if (updateError) {
            console.error(`❌ Update error: ${updateError.message}`);
          } else {
            console.log(`✅ Updated database with logo URL`);
            updated++;
          }
          
          matched++;
        } else {
          console.log(`❌ No logo URL found for: ${company.name} (place_id: ${company.place_id})`);
          noMatch++;
        }
        
      } catch (err) {
        console.error(`❌ Error processing ${company.name}: ${err.message}`);
      }
    }
    
    // Step 4: Test URLs
    console.log('\n🧪 Testing updated companies...');
    
    const { data: updatedCompanies } = await supabase
      .from('companies')
      .select('name, slug, logo_storage_path')
      .eq('predicted_label', 'logo')
      .not('logo_storage_path', 'like', '/logos/%')
      .limit(5);
    
    if (updatedCompanies && updatedCompanies.length > 0) {
      updatedCompanies.forEach(company => {
        console.log(`📍 ${company.name}:`);
        console.log(`   Template: /t/moderntrust/${company.slug}`);
        console.log(`   Logo URL: ${company.logo_storage_path}`);
      });
    }
    
    // Step 5: Summary
    console.log('\n📊 SUMMARY:');
    console.log(`📁 Logo URLs in CSV: ${csvLogosFound}`);
    console.log(`🏢 Companies processed: ${companies.length}`);
    console.log(`✅ Successful matches: ${matched}`);
    console.log(`📝 Database updates: ${updated}`);
    console.log(`❌ No matches: ${noMatch}`);
    
    console.log('\n🎉 Logo URL mapping complete!');
    console.log('Companies now have direct URLs to their real logos.');
    
  } catch (error) {
    console.error('❌ Mapping failed:', error);
  }
}

mapRealLogoUrls();