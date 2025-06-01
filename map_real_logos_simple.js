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

async function mapRealLogos() {
  console.log('🔍 Finding real logo URLs from CSV and mapping to companies...');
  
  try {
    // Step 1: Read the enhanced CSV with real logo URLs
    console.log('\n📊 Reading enhanced CSV with real logos...');
    
    const csvPath = '/home/runner/workspace/CompanyData/enhanced_hvac_with_reviews_timeline.csv';
    const csvText = fs.readFileSync(csvPath, 'utf8');
    const csvData = parseCSV(csvText);
    
    // Filter for companies with real logos
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
    
    // Show first 5 logo examples
    console.log('\n🖼️  Logo examples:');
    logoData.slice(0, 5).forEach((item, index) => {
      console.log(`${index + 1}. ${item.name}: ${item.logo}`);
    });
    
    // Step 2: Get companies from Supabase with predicted_label='logo'
    console.log('\n🎯 Getting companies from Supabase...');
    
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name, slug, place_id, predicted_label')
      .eq('predicted_label', 'logo')
      .limit(50); // Get more to find matches
    
    if (error) {
      console.error('❌ Error fetching companies:', error);
      return;
    }
    
    console.log(`📋 Found ${companies?.length || 0} logo companies in Supabase`);
    
    // Step 3: Match by place_id
    console.log('\n🔗 Matching by place_id...');
    
    const matches = [];
    
    for (const company of companies) {
      const logoMatch = logoData.find(logo => logo.place_id === company.place_id);
      
      if (logoMatch) {
        matches.push({
          supabase: company,
          logo: logoMatch,
          testUrl: `/t/moderntrust/${company.slug}`
        });
      }
    }
    
    console.log(`🎯 Found ${matches.length} matches by place_id`);
    
    // Step 4: Test first 10 matches
    console.log('\n🧪 Testing first 10 logo matches:');
    
    const testMatches = matches.slice(0, 10);
    
    for (const match of testMatches) {
      console.log(`\n📍 ${match.supabase.name}:`);
      console.log(`   Place ID: ${match.supabase.place_id}`);
      console.log(`   Logo URL: ${match.logo.logo}`);
      console.log(`   Test Page: https://atlasgrowth.ai${match.testUrl}`);
      
      // Test if logo URL is accessible
      try {
        const response = await fetch(match.logo.logo, { method: 'HEAD' });
        if (response.ok) {
          console.log(`   ✅ Logo accessible (${response.status})`);
        } else {
          console.log(`   ❌ Logo not accessible (${response.status})`);
        }
      } catch (err) {
        console.log(`   ❌ Logo test failed: ${err.message}`);
      }
    }
    
    // Step 5: Summary
    console.log('\n📊 SUMMARY:');
    console.log(`📁 Total companies with logos in CSV: ${logoData.length}`);
    console.log(`🏢 Logo companies in Supabase: ${companies.length}`);
    console.log(`🔗 Successful place_id matches: ${matches.length}`);
    console.log(`🧪 Tested: ${testMatches.length}`);
    
    // Step 6: Show which companies we can update
    console.log('\n🎯 READY TO UPDATE:');
    testMatches.forEach((match, index) => {
      console.log(`${index + 1}. ${match.supabase.name} -> Real logo available`);
    });
    
    return testMatches;
    
  } catch (error) {
    console.error('❌ Logo mapping failed:', error);
  }
}

mapRealLogos();