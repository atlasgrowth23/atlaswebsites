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

async function mapAllLogoUrls() {
  console.log('🔗 Mapping ALL logo URLs from CSV to database...');
  
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
      if (row.place_id && row.logo && row.logo.trim() && row.logo !== '{}' && row.logo.startsWith('http')) {
        logoMap[row.place_id] = {
          originalUrl: row.logo.trim(),
          cleanedUrl: cleanLogoUrl(row.logo.trim()),
          name: row.name
        };
        csvLogosFound++;
      }
    });
    
    console.log(`✅ Found ${csvLogosFound} logo URLs in CSV`);
    
    // Step 2: Get ALL companies with predicted_label='logo'
    console.log('\n📋 Getting ALL database companies with predicted_label="logo"...');
    
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name, slug, place_id, predicted_label, logo_storage_path')
      .eq('predicted_label', 'logo');
    
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
    const matchedCompanies = [];
    
    for (const company of companies) {
      try {
        const logoData = logoMap[company.place_id];
        
        if (logoData) {
          console.log(`\n✅ MATCH: ${company.name}`);
          console.log(`   Original: ${logoData.originalUrl.substring(0, 80)}...`);
          console.log(`   Cleaned:  ${logoData.cleanedUrl.substring(0, 80)}...`);
          
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
            matchedCompanies.push({
              name: company.name,
              slug: company.slug,
              logoUrl: logoData.cleanedUrl
            });
          }
          
          matched++;
        } else {
          // Silently count no matches
          noMatch++;
        }
        
      } catch (err) {
        console.error(`❌ Error processing ${company.name}: ${err.message}`);
      }
    }
    
    // Step 4: Show test URLs
    console.log('\n🧪 Companies with real logo URLs:');
    
    matchedCompanies.slice(0, 10).forEach((company, index) => {
      console.log(`${index + 1}. ${company.name}:`);
      console.log(`   Template: /t/moderntrust/${company.slug}`);
      console.log(`   Logo URL: ${company.logoUrl.substring(0, 80)}...`);
    });
    
    // Step 5: Summary
    console.log('\n📊 FINAL SUMMARY:');
    console.log(`📁 Logo URLs available in CSV: ${csvLogosFound}`);
    console.log(`🏢 Total companies processed: ${companies.length}`);
    console.log(`✅ Successful matches: ${matched}`);
    console.log(`📝 Database updates: ${updated}`);
    console.log(`❌ No logo available: ${noMatch}`);
    
    console.log('\n🎉 ALL logo URL mapping complete!');
    console.log(`${matched} companies now have real Google logo URLs in database.`);
    console.log(`${noMatch} companies will continue showing text (no logo available).`);
    
  } catch (error) {
    console.error('❌ Mapping failed:', error);
  }
}

mapAllLogoUrls();