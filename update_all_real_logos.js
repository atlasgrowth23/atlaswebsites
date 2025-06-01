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

async function updateAllRealLogos() {
  console.log('🚀 Updating ALL companies with real Google logos...');
  
  try {
    // Step 1: Get all logo data from CSV
    console.log('\n📊 Reading all logo data from CSV...');
    
    const csvPath = '/home/runner/workspace/CompanyData/enhanced_hvac_with_reviews_timeline.csv';
    const csvText = fs.readFileSync(csvPath, 'utf8');
    const csvData = parseCSV(csvText);
    
    // Get all companies with real logos
    const logoData = csvData.filter(row => {
      return row.logo && 
             row.logo.trim() && 
             row.logo !== '{}' && 
             row.logo.startsWith('http') && 
             row.place_id;
    }).map(row => ({
      place_id: row.place_id,
      name: row.name,
      logo: row.logo.trim(),
      slug: row.slug
    }));
    
    console.log(`✅ Found ${logoData.length} companies with real logos in CSV`);
    
    // Step 2: Get ALL companies from Supabase
    console.log('\n🎯 Getting all companies from Supabase...');
    
    const { data: allCompanies, error } = await supabase
      .from('companies')
      .select('id, name, slug, place_id, predicted_label, logo_storage_path');
    
    if (error) {
      console.error('❌ Error fetching companies:', error);
      return;
    }
    
    console.log(`📋 Found ${allCompanies?.length || 0} total companies in Supabase`);
    
    // Step 3: Match ALL companies by place_id
    console.log('\n🔗 Matching all companies by place_id...');
    
    const matches = [];
    
    for (const company of allCompanies) {
      const logoMatch = logoData.find(logo => logo.place_id === company.place_id);
      
      if (logoMatch) {
        matches.push({
          id: company.id,
          name: company.name,
          slug: company.slug,
          place_id: company.place_id,
          current_logo: company.logo_storage_path,
          real_logo: logoMatch.logo,
          predicted_label: company.predicted_label
        });
      }
    }
    
    console.log(`🎯 Found ${matches.length} companies that can get real logos!`);
    
    // Step 4: Update ALL matched companies
    console.log('\n📝 Updating companies with real logos...');
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const match of matches) {
      try {
        console.log(`🔄 Updating: ${match.name}`);
        
        const { error: updateError } = await supabase
          .from('companies')
          .update({
            logo_storage_path: match.real_logo, // Replace with real Google logo URL
            predicted_label: 'logo' // Ensure they're marked as logo companies
          })
          .eq('id', match.id);
        
        if (updateError) {
          console.error(`❌ Error updating ${match.name}:`, updateError);
          errorCount++;
        } else {
          console.log(`✅ Updated: ${match.name}`);
          updatedCount++;
        }
        
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (err) {
        console.error(`❌ Error processing ${match.name}:`, err.message);
        errorCount++;
      }
    }
    
    // Step 5: Summary and test URLs
    console.log('\n📊 UPDATE COMPLETE!');
    console.log(`✅ Successfully updated: ${updatedCount} companies`);
    console.log(`❌ Errors: ${errorCount} companies`);
    console.log(`🎯 Total real logos available: ${logoData.length}`);
    console.log(`🔗 Successfully matched: ${matches.length}`);
    
    // Show first 10 companies you can test
    console.log('\n🧪 TEST THESE COMPANIES (first 10 with real logos):');
    matches.slice(0, 10).forEach((match, index) => {
      console.log(`${index + 1}. ${match.name}:`);
      console.log(`   URL: /t/moderntrust/${match.slug}`);
      console.log(`   Logo: ${match.real_logo}`);
      console.log('');
    });
    
    console.log('🎉 All companies now have real Google logos where available!');
    
  } catch (error) {
    console.error('❌ Bulk update failed:', error);
  }
}

updateAllRealLogos();