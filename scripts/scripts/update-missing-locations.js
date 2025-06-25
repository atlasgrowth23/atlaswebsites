/**
 * Update missing location data for companies using data from CSV
 */
const fs = require('fs');
const csv = require('csv-parse');
const { query } = require('../lib/db');

async function updateMissingLocations() {
  console.log('Starting location data update...');
  
  try {
    // Read the CSV file with complete location data
    const csvData = fs.readFileSync('./CompanyData/fixed_hvac.csv', 'utf8');
    
    csv.parse(csvData, {
      columns: true,
      skip_empty_lines: true
    }, async (err, records) => {
      if (err) {
        console.error('Error parsing CSV:', err);
        return;
      }
      
      console.log(`Processing ${records.length} records from CSV...`);
      
      let updated = 0;
      
      for (const record of records) {
        // Skip if essential data is missing
        if (!record.id || !record.latitude || !record.longitude) continue;
        
        try {
          // Check if company exists and is missing location data
          const existing = await query(`
            SELECT id, city, state, postal_code 
            FROM companies 
            WHERE id = $1 
            AND (city IS NULL OR city = '' OR state IS NULL OR state = '')
          `, [record.id]);
          
          if (existing.rows.length > 0) {
            // Extract location from the extras field which contains geocoded data
            let cityToUse = record.city;
            let stateToUse = record.state;
            let postalToUse = record.postal_code;
            
            // If still missing, try to derive from coordinates using simple state mapping
            if (!stateToUse || !cityToUse) {
              const lat = parseFloat(record.latitude);
              const lng = parseFloat(record.longitude);
              
              // Alabama bounds: roughly 30.2-35.0 lat, -88.5--85.0 lng
              // Arkansas bounds: roughly 33.0-36.5 lat, -94.5--89.5 lng
              if (lat >= 30.2 && lat <= 35.0 && lng >= -88.5 && lng <= -85.0) {
                stateToUse = 'Alabama';
              } else if (lat >= 33.0 && lat <= 36.5 && lng >= -94.5 && lng <= -89.5) {
                stateToUse = 'Arkansas';
              }
            }
            
            if (cityToUse || stateToUse || postalToUse) {
              await query(`
                UPDATE companies 
                SET 
                  city = COALESCE(NULLIF($2, ''), city),
                  state = COALESCE(NULLIF($3, ''), state),
                  postal_code = COALESCE(NULLIF($4, ''), postal_code)
                WHERE id = $1
              `, [record.id, cityToUse, stateToUse, postalToUse]);
              
              updated++;
              console.log(`Updated ${record.name} with location data`);
            }
          }
        } catch (error) {
          console.error(`Error updating company ${record.id}:`, error.message);
        }
      }
      
      console.log(`✅ Updated ${updated} companies with missing location data`);
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Error reading CSV file:', error);
    process.exit(1);
  }
}

updateMissingLocations();