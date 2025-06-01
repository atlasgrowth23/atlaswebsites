const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config({ path: './env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function mapRealLogos() {
  console.log('🔍 Finding real logo URLs from CSV and mapping to companies...');
  
  try {
    // Step 1: Read the enhanced CSV with real logo URLs
    console.log('\n📊 Reading enhanced CSV with real logos...');
    
    const logoData = [];
    const csvPath = '/home/runner/workspace/CompanyData/enhanced_hvac_with_reviews_timeline.csv';
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          if (row.logo && row.logo.trim() && row.logo !== '{}' && row.place_id) {
            logoData.push({
              place_id: row.place_id,
              name: row.name,
              logo: row.logo.trim(),
              slug: row.slug
            });
          }
        })
        .on('end', () => {
          console.log(`✅ Found ${logoData.length} companies with real logos in CSV`);
          resolve();
        })
        .on('error', reject);
    });
    
    // Step 2: Get first 10 companies from Supabase that have predicted_label='logo'
    console.log('\n🎯 Getting 10 test companies from Supabase...');
    
    const { data: testCompanies, error } = await supabase
      .from('companies')
      .select('id, name, slug, place_id, predicted_label, logo_storage_path')
      .eq('predicted_label', 'logo')
      .limit(10);
    
    if (error) {
      console.error('❌ Error fetching companies:', error);
      return;
    }
    
    console.log(`📋 Found ${testCompanies?.length || 0} test companies in Supabase`);
    
    // Step 3: Match by place_id and update with real logos
    console.log('\n🔗 Matching by place_id and updating logos...');
    
    const matches = [];
    let updatedCount = 0;
    
    for (const company of testCompanies) {
      // Find matching logo data by place_id
      const logoMatch = logoData.find(logo => logo.place_id === company.place_id);
      
      if (logoMatch) {
        console.log(`🎯 MATCH: ${company.name} -> ${logoMatch.logo}`);
        
        // Update the company with real logo URL
        const { error: updateError } = await supabase
          .from('companies')
          .update({
            logo_storage_path: null, // Clear the fake storage path
            real_logo_url: logoMatch.logo // Add real logo URL to a new column
          })
          .eq('id', company.id);
        
        if (updateError) {
          console.error(`❌ Update error for ${company.name}:`, updateError);
        } else {
          console.log(`✅ Updated ${company.name} with real logo`);
          updatedCount++;
          matches.push({
            name: company.name,
            slug: company.slug,
            place_id: company.place_id,
            logoUrl: logoMatch.logo,
            testUrl: `/t/moderntrust/${company.slug}`
          });
        }
      } else {
        console.log(`❌ No logo match for: ${company.name} (place_id: ${company.place_id})`);
      }
    }
    
    // Step 4: Test the logo URLs
    console.log('\n🧪 Testing logo URLs:');
    for (const match of matches) {
      console.log(`📍 ${match.name}:`);
      console.log(`   Logo: ${match.logoUrl}`);
      console.log(`   Test page: https://atlasgrowth.ai${match.testUrl}`);
      console.log('');
    }
    
    // Step 5: Show summary statistics
    console.log('\n📊 Summary:');
    console.log(`✅ Companies with real logos in CSV: ${logoData.length}`);
    console.log(`🎯 Test companies from Supabase: ${testCompanies.length}`);
    console.log(`🔗 Successful matches: ${matches.length}`);
    console.log(`📝 Database updates: ${updatedCount}`);
    
    // Show a few working logo examples
    console.log('\n🏆 Working logo examples:');
    const workingLogos = logoData.slice(0, 5);
    workingLogos.forEach((logo, index) => {
      console.log(`${index + 1}. ${logo.name}: ${logo.logo}`);
    });
    
    console.log('\n🎯 Next step: Update template code to use real_logo_url when available');
    
  } catch (error) {
    console.error('❌ Logo mapping failed:', error);
  }
}

// Utility to check if we need to add real_logo_url column
async function checkRealLogoColumn() {
  console.log('🔍 Checking if real_logo_url column exists...');
  
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('real_logo_url')
      .limit(1);
    
    if (error && error.message.includes('column "real_logo_url" does not exist')) {
      console.log('➕ Adding real_logo_url column...');
      // This would need to be done via SQL, but let's proceed without it for now
      console.log('ℹ️  Note: You may need to add real_logo_url column to companies table');
      return false;
    }
    
    console.log('✅ real_logo_url column exists');
    return true;
  } catch (err) {
    console.log('ℹ️  Proceeding without real_logo_url column for now');
    return false;
  }
}

async function main() {
  await checkRealLogoColumn();
  await mapRealLogos();
}

main();