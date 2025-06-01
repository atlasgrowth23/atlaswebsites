const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function processAllLogoCompanies() {
  console.log('🔍 Processing ALL companies with predicted_label="logo"...');
  
  try {
    // Step 1: Get all companies with predicted_label='logo'
    console.log('\n📊 Getting all logo companies from database...');
    
    const { data: logoCompanies, error } = await supabase
      .from('companies')
      .select('id, name, slug, predicted_label, logo_storage_path')
      .eq('predicted_label', 'logo');
    
    if (error) {
      console.error('❌ Error fetching logo companies:', error);
      return;
    }
    
    console.log(`📋 Found ${logoCompanies?.length || 0} companies with predicted_label='logo'`);
    
    // Step 2: Check current logo status
    console.log('\n🔍 Analyzing current logo status...');
    
    let hasRealLogo = 0;
    let hasStoragePath = 0;
    let hasNoLogo = 0;
    
    const needsProcessing = [];
    
    logoCompanies.forEach(company => {
      if (company.logo_storage_path) {
        if (company.logo_storage_path.startsWith('http')) {
          hasRealLogo++;
        } else {
          hasStoragePath++;
        }
      } else {
        hasNoLogo++;
        needsProcessing.push(company);
      }
    });
    
    console.log(`✅ Has real Google logos: ${hasRealLogo}`);
    console.log(`📁 Has storage paths: ${hasStoragePath}`);
    console.log(`❌ No logo at all: ${hasNoLogo}`);
    console.log(`🔧 Needs processing: ${needsProcessing.length}`);
    
    // Step 3: Process companies that need logos
    if (needsProcessing.length > 0) {
      console.log('\n🎨 Generating logos for companies without them...');
      
      let processedCount = 0;
      
      for (const company of needsProcessing) {
        try {
          console.log(`🔄 Processing: ${company.name}`);
          
          // Generate logo path for this company
          const logoPath = `/logos/${company.slug}.png`;
          
          // Update with storage path
          const { error: updateError } = await supabase
            .from('companies')
            .update({
              logo_storage_path: logoPath
            })
            .eq('id', company.id);
          
          if (updateError) {
            console.error(`❌ Error updating ${company.name}:`, updateError);
          } else {
            console.log(`✅ Set logo path: ${company.name} -> ${logoPath}`);
            processedCount++;
          }
          
          // Small delay
          await new Promise(resolve => setTimeout(resolve, 10));
          
        } catch (err) {
          console.error(`❌ Error processing ${company.name}:`, err.message);
        }
      }
      
      console.log(`\n✅ Processed ${processedCount} companies with logo paths`);
    }
    
    // Step 4: Final summary
    console.log('\n📊 FINAL STATUS:');
    
    const { data: finalCount, error: countError } = await supabase
      .from('companies')
      .select('id, name, slug, logo_storage_path', { count: 'exact' })
      .eq('predicted_label', 'logo')
      .not('logo_storage_path', 'is', null);
    
    if (!countError) {
      console.log(`🎯 Total logo companies: ${logoCompanies.length}`);
      console.log(`✅ Companies with logo paths: ${finalCount.length}`);
      console.log(`📝 Ready for logo generation: ${finalCount.length}`);
    }
    
    // Step 5: Show test companies
    console.log('\n🧪 TEST THESE COMPANIES (first 10):');
    
    const testCompanies = logoCompanies.slice(0, 10);
    testCompanies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name}:`);
      console.log(`   URL: /t/moderntrust/${company.slug}`);
      console.log(`   Logo status: ${company.logo_storage_path ? 
        (company.logo_storage_path.startsWith('http') ? 'Real Google logo' : 'Storage path set') : 
        'No logo path'}`);
      console.log('');
    });
    
    console.log('🎉 All companies with predicted_label="logo" are now processed!');
    
  } catch (error) {
    console.error('❌ Processing failed:', error);
  }
}

processAllLogoCompanies();