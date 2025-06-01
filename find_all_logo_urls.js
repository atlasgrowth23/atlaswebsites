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

// Normalize phone number for matching
function normalizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/\D/g, ''); // Remove all non-digits
}

async function findAllLogoUrls() {
  console.log('🔍 Finding ALL logo URLs from multiple CSV files...');
  
  try {
    // Step 1: Load all CSV files with logos
    console.log('\n📊 Loading all CSV files...');
    
    const csvFiles = [
      { 
        name: 'enhanced_hvac_with_reviews_timeline.csv',
        path: '/home/runner/workspace/CompanyData/enhanced_hvac_with_reviews_timeline.csv'
      },
      { 
        name: 'combined_filtered_hvac.csv',
        path: '/home/runner/workspace/CompanyData/combined_filtered_hvac.csv'
      },
      { 
        name: 'companies_rows_original.csv',
        path: '/home/runner/workspace/CompanyData/companies_rows_original.csv'
      },
      { 
        name: 'fixed_hvac.csv',
        path: '/home/runner/workspace/CompanyData/fixed_hvac.csv'
      },
      { 
        name: 'updated_hvac_with_locations.csv',
        path: '/home/runner/workspace/CompanyData/updated_hvac_with_locations.csv'
      }
    ];
    
    const allLogoData = {
      byPlaceId: {},
      byPhone: {},
      byName: {}
    };
    
    let totalLogosFound = 0;
    
    for (const csvFile of csvFiles) {
      console.log(`\n📋 Processing ${csvFile.name}...`);
      
      try {
        const csvText = fs.readFileSync(csvFile.path, 'utf8');
        const csvData = parseCSV(csvText);
        
        let logosInFile = 0;
        
        csvData.forEach(row => {
          // Check for valid logo URL
          if (row.logo && row.logo.trim() && row.logo !== '{}' && row.logo.startsWith('http')) {
            const logoData = {
              originalUrl: row.logo.trim(),
              cleanedUrl: cleanLogoUrl(row.logo.trim()),
              name: row.name,
              source: csvFile.name
            };
            
            // Index by place_id
            if (row.place_id) {
              allLogoData.byPlaceId[row.place_id] = logoData;
            }
            
            // Index by normalized phone
            if (row.phone) {
              const normalizedPhone = normalizePhone(row.phone);
              if (normalizedPhone.length >= 10) {
                allLogoData.byPhone[normalizedPhone] = logoData;
              }
            }
            
            // Index by normalized name
            if (row.name) {
              const normalizedName = row.name.toLowerCase().trim();
              allLogoData.byName[normalizedName] = logoData;
            }
            
            logosInFile++;
            totalLogosFound++;
          }
        });
        
        console.log(`   ✅ Found ${logosInFile} logos in ${csvFile.name}`);
        
      } catch (err) {
        console.log(`   ⚠️  Could not read ${csvFile.name}: ${err.message}`);
      }
    }
    
    console.log(`\n📊 TOTAL LOGOS FOUND: ${totalLogosFound}`);
    console.log(`   📍 By place_id: ${Object.keys(allLogoData.byPlaceId).length}`);
    console.log(`   📞 By phone: ${Object.keys(allLogoData.byPhone).length}`);
    console.log(`   🏢 By name: ${Object.keys(allLogoData.byName).length}`);
    
    // Step 2: Get all companies that need logos
    console.log('\n🗄️  Getting all companies that need logos...');
    
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name, slug, place_id, phone, predicted_label, logo_storage_path')
      .eq('predicted_label', 'logo')
      .or('logo_storage_path.is.null,logo_storage_path.eq.');
    
    if (error) {
      console.error('❌ Error fetching companies:', error);
      return;
    }
    
    console.log(`📋 Found ${companies.length} companies that need logos`);
    
    // Step 3: Match companies with logos using multiple methods
    console.log('\n🔗 Matching companies with logos...');
    
    let matchedByPlaceId = 0;
    let matchedByPhone = 0;
    let matchedByName = 0;
    let totalMatched = 0;
    let updated = 0;
    
    const matchedCompanies = [];
    
    for (const company of companies) {
      let logoData = null;
      let matchMethod = '';
      
      // Try matching by place_id first
      if (company.place_id && allLogoData.byPlaceId[company.place_id]) {
        logoData = allLogoData.byPlaceId[company.place_id];
        matchMethod = 'place_id';
        matchedByPlaceId++;
      }
      // Try matching by phone number
      else if (company.phone) {
        const normalizedPhone = normalizePhone(company.phone);
        if (normalizedPhone.length >= 10 && allLogoData.byPhone[normalizedPhone]) {
          logoData = allLogoData.byPhone[normalizedPhone];
          matchMethod = 'phone';
          matchedByPhone++;
        }
      }
      // Try matching by company name
      if (!logoData && company.name) {
        const normalizedName = company.name.toLowerCase().trim();
        if (allLogoData.byName[normalizedName]) {
          logoData = allLogoData.byName[normalizedName];
          matchMethod = 'name';
          matchedByName++;
        }
      }
      
      if (logoData) {
        console.log(`\n✅ MATCH (${matchMethod}): ${company.name}`);
        console.log(`   Source: ${logoData.source}`);
        console.log(`   URL: ${logoData.cleanedUrl.substring(0, 60)}...`);
        
        // Update database with logo URL
        const { error: updateError } = await supabase
          .from('companies')
          .update({
            logo_storage_path: logoData.cleanedUrl
          })
          .eq('id', company.id);
        
        if (updateError) {
          console.error(`❌ Update error: ${updateError.message}`);
        } else {
          console.log(`✅ Updated database`);
          updated++;
          matchedCompanies.push({
            name: company.name,
            slug: company.slug,
            logoUrl: logoData.cleanedUrl,
            matchMethod: matchMethod,
            source: logoData.source
          });
        }
        
        totalMatched++;
      }
    }
    
    // Step 4: Show test URLs
    console.log('\n🧪 Sample companies with mapped logos:');
    
    matchedCompanies.slice(0, 10).forEach((company, index) => {
      console.log(`${index + 1}. ${company.name} (${company.matchMethod}):`)
      console.log(`   Template: /t/moderntrust/${company.slug}`);
      console.log(`   Source: ${company.source}`);
      console.log(`   Logo: ${company.logoUrl.substring(0, 60)}...`);
    });
    
    // Step 5: Final summary
    console.log('\n📊 COMPREHENSIVE MAPPING SUMMARY:');
    console.log(`📁 Total logos available across all CSVs: ${totalLogosFound}`);
    console.log(`🏢 Companies needing logos: ${companies.length}`);
    console.log(`✅ Total matches found: ${totalMatched}`);
    console.log(`   📍 Matched by place_id: ${matchedByPlaceId}`);
    console.log(`   📞 Matched by phone: ${matchedByPhone}`);
    console.log(`   🏢 Matched by name: ${matchedByName}`);
    console.log(`📝 Database updates successful: ${updated}`);
    console.log(`❌ Still need logos: ${companies.length - totalMatched}`);
    
    // Show breakdown by match method
    console.log('\n🔍 Match method breakdown:');
    const methodBreakdown = {};
    matchedCompanies.forEach(company => {
      methodBreakdown[company.matchMethod] = (methodBreakdown[company.matchMethod] || 0) + 1;
    });
    
    Object.entries(methodBreakdown).forEach(([method, count]) => {
      console.log(`   ${method}: ${count} companies`);
    });
    
    console.log('\n🎉 COMPREHENSIVE LOGO MAPPING COMPLETE!');
    console.log(`✅ Successfully mapped ${updated} additional logo URLs to companies`);
    console.log(`📋 Now ${updated + 29} total companies have real logo URLs`);
    console.log(`⚠️  ${companies.length - totalMatched} companies still need logos from other sources`);
    
  } catch (error) {
    console.error('❌ Comprehensive mapping failed:', error);
  }
}

findAllLogoUrls();