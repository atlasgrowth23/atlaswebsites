const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDuplicates() {
  console.log('🔍 Checking for existing companies in Supabase...');
  
  try {
    // Get all companies currently in the table
    const { data: existingCompanies, error } = await supabase
      .from('companies')
      .select('slug, name, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching companies:', error);
      return;
    }
    
    console.log(`📊 Found ${existingCompanies?.length || 0} existing companies in database`);
    
    if (existingCompanies && existingCompanies.length > 0) {
      console.log('\n📋 Existing companies (first 10):');
      existingCompanies.slice(0, 10).forEach((company, index) => {
        console.log(`  ${index + 1}. ${company.name} (slug: ${company.slug})`);
      });
      
      if (existingCompanies.length > 10) {
        console.log(`  ... and ${existingCompanies.length - 10} more`);
      }
      
      console.log('\n🎯 SOLUTION: You need to either:');
      console.log('   1. DELETE existing companies first: DELETE FROM companies;');
      console.log('   2. Or use UPSERT instead of INSERT in your import');
    } else {
      console.log('✅ No existing companies found - CSV should import cleanly');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkDuplicates();