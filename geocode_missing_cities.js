const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Rate limiting to avoid hitting Google API limits
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function geocodeMissingCities() {
  console.log('🔍 Finding companies with missing cities...');
  
  try {
    // Get companies where city is null, empty, or 'nan'
    const { data: companiesWithoutCity, error } = await supabase
      .from('companies')
      .select('id, name, slug, city, latitude, longitude')
      .or('city.is.null,city.eq.,city.eq.nan,city.eq.NaN');
    
    if (error) {
      console.error('❌ Error fetching companies:', error);
      return;
    }
    
    console.log(`📊 Found ${companiesWithoutCity?.length || 0} companies with missing cities`);
    
    if (!companiesWithoutCity || companiesWithoutCity.length === 0) {
      console.log('✅ All companies have cities!');
      return;
    }
    
    // Check for Google API key
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!googleApiKey) {
      console.error('❌ GOOGLE_MAPS_API_KEY not found in environment variables');
      console.log('🎯 Please add GOOGLE_MAPS_API_KEY=your_key to env.local');
      return;
    }
    
    console.log('🌍 Starting geocoding process...');
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const company of companiesWithoutCity) {
      try {
        // Skip if no coordinates
        if (!company.latitude || !company.longitude) {
          console.log(`⚠️  Skipping ${company.name} - no coordinates`);
          continue;
        }
        
        console.log(`🔍 Geocoding: ${company.name} (${company.latitude}, ${company.longitude})`);
        
        // Reverse geocode using Google Maps API
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${company.latitude},${company.longitude}&key=${googleApiKey}`
        );
        
        const data = await response.json();
        
        if (data.status === 'OK' && data.results.length > 0) {
          // Extract city from address components
          const result = data.results[0];
          let city = null;
          
          for (const component of result.address_components) {
            if (component.types.includes('locality')) {
              city = component.long_name;
              break;
            } else if (component.types.includes('administrative_area_level_3')) {
              city = component.long_name;
              break;
            } else if (component.types.includes('sublocality')) {
              city = component.long_name;
              break;
            }
          }
          
          if (city) {
            // Update the company in Supabase
            const { error: updateError } = await supabase
              .from('companies')
              .update({ city: city })
              .eq('id', company.id);
            
            if (updateError) {
              console.error(`❌ Failed to update ${company.name}:`, updateError);
              errorCount++;
            } else {
              console.log(`✅ Updated ${company.name}: ${city}`);
              updatedCount++;
            }
          } else {
            console.log(`⚠️  No city found for ${company.name}`);
          }
        } else {
          console.log(`⚠️  Geocoding failed for ${company.name}: ${data.status}`);
          if (data.status === 'OVER_QUERY_LIMIT') {
            console.log('⏸️  Rate limit hit, waiting 2 seconds...');
            await delay(2000);
          }
        }
        
        // Rate limiting: wait 100ms between requests
        await delay(100);
        
      } catch (err) {
        console.error(`❌ Error processing ${company.name}:`, err.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Geocoding complete:`);
    console.log(`✅ Updated: ${updatedCount} companies`);
    console.log(`❌ Errors: ${errorCount} companies`);
    console.log(`📍 Remaining without cities: ${companiesWithoutCity.length - updatedCount}`);
    
  } catch (error) {
    console.error('❌ Geocoding process failed:', error);
  }
}

geocodeMissingCities();