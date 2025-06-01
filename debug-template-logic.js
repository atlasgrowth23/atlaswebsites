const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugTemplate() {
  console.log('🔍 Debugging template logic...');

  // Check what's actually in the database
  const { data: companies, error } = await supabase
    .from('companies')
    .select('name, slug, predicted_label, logo_storage_path')
    .limit(10);

  if (error) {
    console.error('❌ Database error:', error);
    return;
  }

  console.log('📊 Sample companies:');
  companies.forEach(company => {
    console.log(`  - ${company.name} (${company.slug})`);
    console.log(`    Label: ${company.predicted_label}`);
    console.log(`    Logo path: ${company.logo_storage_path}`);
    console.log('');
  });

  // Check frames table
  const { data: frames } = await supabase
    .from('frames')
    .select('*');

  console.log('🖼️ Template frames:');
  frames?.forEach(frame => {
    console.log(`  - ${frame.template_key}/${frame.slug}: ${frame.default_url}`);
  });

  // Check company frames
  const { data: companyFrames } = await supabase
    .from('company_frames')
    .select('*')
    .limit(5);

  console.log('🏢 Company frames:');
  console.log(companyFrames || 'None found');

  // Test specific company
  const testSlug = 'airzone-llc';
  const { data: testCompany } = await supabase
    .from('companies')
    .select('*')
    .eq('slug', testSlug)
    .single();

  if (testCompany) {
    console.log(`\n🧪 Testing ${testSlug}:`);
    console.log(`  Name: ${testCompany.name}`);
    console.log(`  Predicted label: ${testCompany.predicted_label}`);
    console.log(`  Logo storage path: ${testCompany.logo_storage_path}`);
    
    if (testCompany.predicted_label === 'logo' && testCompany.logo_storage_path) {
      const logoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images${testCompany.logo_storage_path}`;
      console.log(`  Constructed logo URL: ${logoUrl}`);
    } else {
      console.log(`  Should show company name as text`);
    }
  }
}

debugTemplate();