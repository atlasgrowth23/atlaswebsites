const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function debugTemplateEditor() {
  console.log('🔍 Debugging Template Editor...\n');

  // 1. Check database structure
  console.log('1. Database Structure Check:');
  
  // Check company_frames table structure
  const { data: frameColumns, error: frameError } = await supabaseAdmin.rpc('get_table_columns', { table_name: 'company_frames' });
  if (frameError) {
    console.log('   ❌ Could not get company_frames structure:', frameError.message);
  } else {
    console.log('   ✅ company_frames table structure:', frameColumns || 'RPC not available, checking data instead...');
  }

  // Check if we have any sample data
  const { data: sampleFrames, error: sampleError } = await supabaseAdmin
    .from('company_frames')
    .select('*')
    .limit(3);
  
  if (sampleError) {
    console.log('   ❌ Error fetching sample frames:', sampleError.message);
  } else {
    console.log('   📄 Sample company_frames data:', sampleFrames);
  }

  // 2. Test a specific company
  console.log('\n2. Company Frame Test:');
  const { data: companies, error: companiesError } = await supabaseAdmin
    .from('companies')
    .select('id, slug, name')
    .limit(1);

  if (companiesError || !companies || companies.length === 0) {
    console.log('   ❌ No companies found for testing');
    return;
  }

  const testCompany = companies[0];
  console.log(`   📊 Testing with company: ${testCompany.name} (${testCompany.slug})`);

  // Check frames for this company
  const { data: companyFrames, error: companyFramesError } = await supabaseAdmin
    .from('company_frames')
    .select('*')
    .eq('company_id', testCompany.id);

  if (companyFramesError) {
    console.log('   ❌ Error fetching company frames:', companyFramesError.message);
  } else {
    console.log('   🖼️  Current frames for company:', companyFrames);
  }

  // 3. Test the save process
  console.log('\n3. Testing Save Process:');
  
  const testUrl = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop';
  
  console.log(`   💾 Attempting to save test frame: hero_img = ${testUrl}`);
  
  // Simulate the setCompanyFrame function
  const { data: upsertResult, error: upsertError } = await supabaseAdmin
    .from('company_frames')
    .upsert({
      company_id: testCompany.id,
      slug: 'hero_img',
      url: testUrl,
      updated_at: new Date().toISOString()
    })
    .select();

  if (upsertError) {
    console.log('   ❌ Error upserting frame:', upsertError.message);
  } else {
    console.log('   ✅ Successfully saved frame:', upsertResult);
  }

  // 4. Test retrieval
  console.log('\n4. Testing Retrieval:');
  
  const { data: retrievedFrames, error: retrieveError } = await supabaseAdmin
    .from('company_frames')
    .select('*')
    .eq('company_id', testCompany.id);

  if (retrieveError) {
    console.log('   ❌ Error retrieving frames:', retrieveError.message);
  } else {
    console.log('   🔍 Retrieved frames:', retrievedFrames);
  }

  // 5. Test the getPhotoUrl logic
  console.log('\n5. Testing getPhotoUrl Logic:');
  
  const mockCompany = {
    company_frames: {},
    template_frames: {}
  };
  
  // Simulate company frames
  if (retrievedFrames) {
    retrievedFrames.forEach(frame => {
      mockCompany.company_frames[frame.slug] = frame.url;
    });
  }
  
  console.log('   🏢 Mock company object:', mockCompany);
  
  // Test the photo URL logic
  function testGetPhotoUrl(company, frameName, templateKey) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    // First try company-specific frame (custom override)
    if (company?.company_frames && company.company_frames[frameName]) {
      const path = company.company_frames[frameName];
      const url = path.startsWith('http') ? path : `${supabaseUrl}/storage/v1/object/public/images${path}`;
      return url;
    }
    
    // Then try template default frame
    if (company?.template_frames && company.template_frames[frameName]) {
      const path = company.template_frames[frameName];
      const url = path.startsWith('http') ? path : `${supabaseUrl}/storage/v1/object/public/images${path}`;
      return url;
    }
    
    return null;
  }
  
  const heroUrl = testGetPhotoUrl(mockCompany, 'hero_img', 'moderntrust');
  console.log('   🖼️  getPhotoUrl result for hero_img:', heroUrl);

  console.log('\n✅ Debug complete!');
}

// Run if called directly
if (require.main === module) {
  debugTemplateEditor().catch(console.error);
}

module.exports = { debugTemplateEditor };