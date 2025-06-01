const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBeardenStatus() {
  console.log('🔍 Checking Bearden Mechanical status...');
  
  try {
    // Check Bearden in database
    const { data: bearden } = await supabase
      .from('companies')
      .select('*')
      .ilike('name', '%bearden%')
      .single();
    
    console.log('\n📋 Bearden Mechanical in database:');
    console.log(`Name: ${bearden.name}`);
    console.log(`Slug: ${bearden.slug}`);
    console.log(`Predicted Label: ${bearden.predicted_label}`);
    console.log(`Logo Storage Path: ${bearden.logo_storage_path}`);
    
    // Check what's in Supabase Storage logos folder
    console.log('\n📁 Checking Supabase Storage logos folder...');
    
    const { data: logoFiles, error: listError } = await supabase.storage
      .from('images')
      .list('logos', { limit: 10 });
    
    if (listError) {
      console.error('❌ Error listing logos:', listError);
    } else {
      console.log(`📊 Found ${logoFiles.length} files in logos folder:`);
      logoFiles.forEach(file => {
        console.log(`  - ${file.name} (${file.metadata?.size || 'unknown'} bytes)`);
      });
    }
    
    // Check frames table
    console.log('\n🖼️  Checking frames table...');
    
    const { data: frames } = await supabase
      .from('frames')
      .select('*')
      .eq('template_key', 'moderntrust');
    
    console.log('📋 ModernTrust frames:');
    frames?.forEach(frame => {
      console.log(`  - ${frame.slug}: ${frame.default_url}`);
    });
    
    // Test template image URLs
    console.log('\n🧪 Testing template image URLs...');
    
    const testUrls = [
      '/templates/moderntrust/hero.jpg',
      '/templates/moderntrust/hero2.jpg', 
      '/templates/moderntrust/about.jpg'
    ];
    
    for (const path of testUrls) {
      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(path);
      
      console.log(`${path}: ${data.publicUrl}`);
      
      // Test if file exists
      try {
        const response = await fetch(data.publicUrl, { method: 'HEAD' });
        console.log(`  Status: ${response.status} ${response.ok ? '✅' : '❌'}`);
      } catch (err) {
        console.log(`  Status: Error ❌`);
      }
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkBeardenStatus();