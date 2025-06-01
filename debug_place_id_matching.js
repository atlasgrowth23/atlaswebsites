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

async function debugPlaceIdMatching() {
  console.log('🔍 Debugging place_id matching...');
  
  try {
    // Step 1: Check CSV data
    console.log('\n📊 Checking CSV data...');
    
    const csvPath = '/home/runner/workspace/CompanyData/enhanced_hvac_with_reviews_timeline.csv';
    const csvText = fs.readFileSync(csvPath, 'utf8');
    const csvData = parseCSV(csvText);
    
    console.log(`📋 Total rows in CSV: ${csvData.length}`);
    
    // Check logo column
    const csvWithLogos = csvData.filter(row => row.logo && row.logo.trim() && row.logo !== '{}' && row.logo.startsWith('http'));
    console.log(`📷 Rows with HTTP logo URLs: ${csvWithLogos.length}`);
    
    // Show first 5 CSV examples
    console.log('\n📋 First 5 CSV companies with logos:');
    csvWithLogos.slice(0, 5).forEach((row, index) => {
      console.log(`${index + 1}. ${row.name}`);
      console.log(`   Place ID: ${row.place_id}`);
      console.log(`   Logo: ${row.logo.substring(0, 80)}...`);
    });
    
    // Step 2: Check database companies
    console.log('\n🗄️  Checking database companies...');
    
    const { data: dbCompanies, error } = await supabase
      .from('companies')
      .select('name, place_id, predicted_label')
      .eq('predicted_label', 'logo')
      .limit(10);
    
    if (error) {
      console.error('❌ Database error:', error);
      return;
    }
    
    console.log(`📋 First 10 database companies with predicted_label='logo':`);
    dbCompanies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name}`);
      console.log(`   Place ID: ${company.place_id}`);
    });
    
    // Step 3: Check for actual matches
    console.log('\n🔗 Checking for place_id matches...');
    
    const csvPlaceIds = new Set(csvWithLogos.map(row => row.place_id));
    const dbPlaceIds = dbCompanies.map(company => company.place_id);
    
    console.log(`📊 CSV place_ids with logos: ${csvPlaceIds.size}`);
    console.log(`📊 Database place_ids (sample): ${dbPlaceIds.length}`);
    
    // Find actual matches
    const matches = [];
    for (const dbCompany of dbCompanies) {
      if (csvPlaceIds.has(dbCompany.place_id)) {
        const csvMatch = csvWithLogos.find(row => row.place_id === dbCompany.place_id);
        matches.push({
          db: dbCompany,
          csv: csvMatch
        });
      }
    }
    
    console.log(`✅ Found ${matches.length} actual matches in sample`);
    
    if (matches.length > 0) {
      console.log('\n🎯 Actual matches found:');
      matches.forEach(match => {
        console.log(`✅ ${match.db.name}`);
        console.log(`   DB place_id: ${match.db.place_id}`);
        console.log(`   CSV place_id: ${match.csv.place_id}`);
        console.log(`   Logo: ${match.csv.logo.substring(0, 60)}...`);
      });
    } else {
      console.log('\n❌ No matches found in sample - checking all database companies...');
      
      // Get ALL database companies to find matches
      const { data: allDbCompanies } = await supabase
        .from('companies')
        .select('name, place_id, predicted_label')
        .eq('predicted_label', 'logo');
      
      const allMatches = [];
      for (const dbCompany of allDbCompanies) {
        if (csvPlaceIds.has(dbCompany.place_id)) {
          const csvMatch = csvWithLogos.find(row => row.place_id === dbCompany.place_id);
          allMatches.push({
            db: dbCompany,
            csv: csvMatch
          });
        }
      }
      
      console.log(`🔍 Found ${allMatches.length} total matches out of ${allDbCompanies.length} logo companies`);
      
      if (allMatches.length > 0) {
        console.log('\n🎯 First 5 actual matches:');
        allMatches.slice(0, 5).forEach(match => {
          console.log(`✅ ${match.db.name}`);
          console.log(`   Place ID: ${match.db.place_id}`);
          console.log(`   Logo: ${match.csv.logo.substring(0, 60)}...`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugPlaceIdMatching();