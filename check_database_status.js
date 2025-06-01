const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStatus() {
  const { data: logoCompanies } = await supabase
    .from('companies')
    .select('id, name, logo_storage_path, predicted_label')
    .eq('predicted_label', 'logo');
  
  const withLogos = logoCompanies.filter(c => c.logo_storage_path && c.logo_storage_path.startsWith('http'));
  const withoutLogos = logoCompanies.filter(c => !c.logo_storage_path || c.logo_storage_path === '');
  
  console.log('📊 CURRENT DATABASE STATUS:');
  console.log(`🏢 Total companies with predicted_label='logo': ${logoCompanies.length}`);
  console.log(`✅ Companies WITH real logo URLs: ${withLogos.length}`);
  console.log(`❌ Companies WITHOUT logos: ${withoutLogos.length}`);
  
  console.log('\n🖼️ Sample companies with logos:');
  withLogos.slice(0, 10).forEach((company, index) => {
    console.log(`${index + 1}. ${company.name}`);
    console.log(`   Logo: ${company.logo_storage_path.substring(0, 80)}...`);
  });
  
  console.log('\n🎯 VERIFICATION:');
  console.log(`✅ ${withLogos.length} companies have real Google logo URLs in database`);
  console.log(`🎨 ${withoutLogos.length} companies will show text logos`);
  console.log(`📋 ${Math.round((withLogos.length / logoCompanies.length) * 100)}% coverage`);
}

checkStatus();