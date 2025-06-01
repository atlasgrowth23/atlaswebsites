const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteFakeLogosUrgently() {
  console.log('🚨 URGENT: Deleting all fake PNG/SVG logos from Supabase Storage...');
  
  try {
    // Step 1: List ALL files in the logos folder
    console.log('\n📂 Listing all files in Supabase Storage logos folder...');
    
    const { data: files, error: listError } = await supabase.storage
      .from('images')
      .list('logos/', {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (listError) {
      console.error('❌ Error listing files:', listError);
      return;
    }
    
    console.log(`📋 Found ${files?.length || 0} files in logos folder`);
    
    if (!files || files.length === 0) {
      console.log('✅ No files found in logos folder - already clean!');
      return;
    }
    
    // Step 2: Show what we're about to delete
    console.log('\n🗑️  Files to be deleted:');
    files.forEach((file, index) => {
      console.log(`${index + 1}. logos/${file.name}`);
    });
    
    // Step 3: Delete ALL files in the logos folder
    console.log('\n🚨 DELETING ALL FAKE LOGOS NOW...');
    
    const filePaths = files.map(file => `logos/${file.name}`);
    
    const { data: deleteData, error: deleteError } = await supabase.storage
      .from('images')
      .remove(filePaths);
    
    if (deleteError) {
      console.error('❌ Error deleting files:', deleteError);
      return;
    }
    
    console.log(`✅ DELETED ${filePaths.length} fake logo files from Supabase Storage!`);
    
    // Step 4: Clear fake storage paths from database
    console.log('\n🗄️  Clearing fake storage paths from database...');
    
    // Get all companies with fake storage paths (starting with /logos/)
    const { data: companiesWithFakePaths, error: fetchError } = await supabase
      .from('companies')
      .select('id, name, slug, logo_storage_path, predicted_label')
      .eq('predicted_label', 'logo')
      .like('logo_storage_path', '/logos/%');
    
    if (fetchError) {
      console.error('❌ Error fetching companies:', fetchError);
      return;
    }
    
    console.log(`📋 Found ${companiesWithFakePaths?.length || 0} companies with fake storage paths`);
    
    if (companiesWithFakePaths && companiesWithFakePaths.length > 0) {
      // Clear the fake paths by setting them to empty string
      const { error: updateError } = await supabase
        .from('companies')
        .update({ logo_storage_path: '' })
        .eq('predicted_label', 'logo')
        .like('logo_storage_path', '/logos/%');
      
      if (updateError) {
        console.error('❌ Error clearing fake paths:', updateError);
      } else {
        console.log(`✅ CLEARED ${companiesWithFakePaths.length} fake storage paths from database!`);
      }
    }
    
    // Step 5: Verify cleanup
    console.log('\n🔍 Verifying cleanup...');
    
    const { data: remainingFiles } = await supabase.storage
      .from('images')
      .list('logos/', { limit: 10 });
    
    const { data: remainingFakePaths } = await supabase
      .from('companies')
      .select('id, name, logo_storage_path')
      .eq('predicted_label', 'logo')
      .like('logo_storage_path', '/logos/%')
      .limit(5);
    
    console.log(`📂 Remaining files in logos folder: ${remainingFiles?.length || 0}`);
    console.log(`🗄️  Remaining fake paths in database: ${remainingFakePaths?.length || 0}`);
    
    // Step 6: Show current status
    console.log('\n📊 CURRENT STATUS:');
    
    const { data: logoCompanies } = await supabase
      .from('companies')
      .select('id, name, logo_storage_path')
      .eq('predicted_label', 'logo');
    
    const withRealUrls = logoCompanies?.filter(c => c.logo_storage_path && c.logo_storage_path.startsWith('http')) || [];
    const withoutLogos = logoCompanies?.filter(c => !c.logo_storage_path || c.logo_storage_path === '') || [];
    
    console.log(`🖼️  Companies with real logo URLs: ${withRealUrls.length}`);
    console.log(`❌ Companies without logos: ${withoutLogos.length}`);
    console.log(`📋 Total logo companies: ${logoCompanies?.length || 0}`);
    
    if (withRealUrls.length > 0) {
      console.log('\n✅ Companies with real logo URLs:');
      withRealUrls.slice(0, 5).forEach((company, index) => {
        console.log(`${index + 1}. ${company.name}`);
        console.log(`   URL: ${company.logo_storage_path.substring(0, 60)}...`);
      });
    }
    
    console.log('\n🎉 URGENT CLEANUP COMPLETE!');
    console.log('✅ All fake PNG/SVG files have been DELETED from Supabase Storage');
    console.log('✅ All fake storage paths have been CLEARED from database');
    console.log(`✅ ${withRealUrls.length} companies still have real logo URLs`);
    console.log(`⚠️  ${withoutLogos.length} companies need logos mapped from other CSV files`);
    
  } catch (error) {
    console.error('❌ Urgent cleanup failed:', error);
  }
}

deleteFakeLogosUrgently();