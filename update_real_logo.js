const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateRealLogo() {
  console.log('🔧 Updating Bearden Mechanical with real logo...');
  
  try {
    // Update the one company we found with real logo
    const realLogoUrl = 'https://lh6.googleusercontent.com/-i37yebl4pPU/AAAAAAAAAAI/AAAAAAAAAAA/Ay9C7S93qX0/s400-p-k-no-ns-nd/photo.jpg';
    const placeId = 'ChIJwbbxXvEOEQMRjjVdfDjoq3c';
    
    // First, let's see what company this is
    const { data: company, error: fetchError } = await supabase
      .from('companies')
      .select('*')
      .eq('place_id', placeId)
      .single();
    
    if (fetchError) {
      console.error('❌ Error fetching company:', fetchError);
      return;
    }
    
    console.log(`📋 Found company: ${company.name}`);
    console.log(`📍 Current logo_storage_path: ${company.logo_storage_path}`);
    
    // Update with real logo URL by overriding the logo_storage_path with the HTTP URL
    const { error: updateError } = await supabase
      .from('companies')
      .update({
        logo_storage_path: realLogoUrl // Use the HTTP URL directly
      })
      .eq('place_id', placeId);
    
    if (updateError) {
      console.error('❌ Update error:', updateError);
      return;
    }
    
    console.log('✅ Updated company with real logo URL');
    
    // Test the template URL
    const testUrl = `https://atlasgrowth.ai/t/moderntrust/${company.slug}`;
    console.log(`🧪 Test the page: ${testUrl}`);
    
    // Verify the update
    const { data: updatedCompany } = await supabase
      .from('companies')
      .select('name, slug, logo_storage_path, predicted_label')
      .eq('place_id', placeId)
      .single();
    
    console.log('\n📊 Updated company details:');
    console.log(`Name: ${updatedCompany.name}`);
    console.log(`Slug: ${updatedCompany.slug}`);
    console.log(`Logo path: ${updatedCompany.logo_storage_path}`);
    console.log(`Predicted label: ${updatedCompany.predicted_label}`);
    
    console.log('\n🎯 The template should now show the real Google logo for this company!');
    
  } catch (error) {
    console.error('❌ Update failed:', error);
  }
}

updateRealLogo();