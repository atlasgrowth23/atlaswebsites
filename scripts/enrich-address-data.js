const { Pool } = require('pg');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Google Maps API key
const GOOGLE_API_KEY = 'AIzaSyC0givyTSzVYc-pJmFw8_fTVdpzVfCHlZo';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Configuration
const CONFIG = {
  batchSize: 10,            // Number of companies to process in each batch
  delayBetweenRequests: 1200, // Delay between API requests in ms (respects API rate limits)
  limitCompanies: 0,        // How many companies to process (0 = all)
  processOnlyMissing: true  // Only process records with missing address data
};

/**
 * Execute a database query with error handling
 */
async function query(text, params = []) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (err) {
    console.error(`Error executing query: ${err.message}`);
    return { rows: [] };
  }
}

/**
 * Get companies that need address enrichment
 */
async function getCompaniesForEnrichment() {
  let queryText = `
    SELECT id, name, latitude, longitude, street, city, postal_code, state
    FROM companies
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
  `;
  
  const queryParams = [];
  
  // Add filter for missing address data if configured
  if (CONFIG.processOnlyMissing) {
    queryText += ` AND (
      street IS NULL OR street = '' OR
      city IS NULL OR city = '' OR
      postal_code IS NULL OR postal_code = '' OR
      state IS NULL OR state = ''
    )`;
  }
  
  // Add limit if specified
  if (CONFIG.limitCompanies > 0) {
    queryText += ` LIMIT $1`;
    queryParams.push(CONFIG.limitCompanies);
  }
  
  // Execute the query
  const result = await query(queryText, queryParams);
  return result.rows;
}

/**
 * Geocode a company's coordinates using Google Geocoding API
 */
async function reverseGeocode(latitude, longitude) {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`;
    const response = await axios.get(url);
    
    // Check if the API call was successful
    if (response.status !== 200 || response.data.status !== 'OK') {
      console.error(`API error: ${response.data.status || response.status}`);
      return null;
    }
    
    // Extract address components from the response
    return extractAddressComponents(response.data);
    
  } catch (error) {
    console.error(`Error geocoding coordinates (${latitude}, ${longitude}):`, error.message);
    return null;
  }
}

/**
 * Extract address components from Google Geocoding API response
 */
function extractAddressComponents(geocodeResponse) {
  const result = {
    formatted_address: '',
    street_number: '',
    street: '',
    city: '',
    county: '',
    state: '',
    state_code: '',
    postal_code: '',
    country: '',
    country_code: ''
  };
  
  // Get the first result (most accurate)
  if (!geocodeResponse.results || geocodeResponse.results.length === 0) {
    return result;
  }
  
  const addressData = geocodeResponse.results[0];
  result.formatted_address = addressData.formatted_address || '';
  
  // Extract address components
  if (addressData.address_components) {
    for (const component of addressData.address_components) {
      if (!component.types) continue;
      
      if (component.types.includes('street_number')) {
        result.street_number = component.long_name;
      }
      
      if (component.types.includes('route')) {
        result.street = component.long_name;
      }
      
      if (component.types.includes('locality') || component.types.includes('sublocality')) {
        result.city = component.long_name;
      }
      
      if (component.types.includes('administrative_area_level_2')) {
        result.county = component.long_name;
      }
      
      if (component.types.includes('administrative_area_level_1')) {
        result.state = component.long_name;
        result.state_code = component.short_name;
      }
      
      if (component.types.includes('postal_code')) {
        result.postal_code = component.long_name;
      }
      
      if (component.types.includes('country')) {
        result.country = component.long_name;
        result.country_code = component.short_name;
      }
    }
  }
  
  // Combine street number and name
  if (result.street_number && result.street) {
    result.street = `${result.street_number} ${result.street}`;
  }
  
  return result;
}

/**
 * Update company with geocoded address data
 */
async function updateCompanyAddress(companyId, addressData) {
  try {
    // Update company with new address columns
    await query(`
      UPDATE companies SET
        geo_street = $1,
        geo_city = $2,
        geo_postal_code = $3,
        geo_state = $4,
        geo_state_code = $5,
        geo_county = $6,
        geo_country = $7,
        geo_country_code = $8,
        geo_formatted_address = $9,
        updated_at = NOW()
      WHERE id = $10
    `, [
      addressData.street || null,
      addressData.city || null,
      addressData.postal_code || null,
      addressData.state || null,
      addressData.state_code || null,
      addressData.county || null,
      addressData.country || null,
      addressData.country_code || null,
      addressData.formatted_address || null,
      companyId
    ]);
    
    return true;
  } catch (err) {
    console.error(`Error updating company ${companyId}:`, err.message);
    return false;
  }
}

/**
 * Process a batch of companies
 */
async function processBatch(companies) {
  console.log(`Processing batch of ${companies.length} companies...`);
  
  let success = 0;
  let errors = 0;
  
  for (const company of companies) {
    try {
      console.log(`Processing ${company.name} (${company.id})...`);
      
      // Geocode the coordinates
      const addressData = await reverseGeocode(company.latitude, company.longitude);
      
      if (!addressData) {
        console.error(`No address data found for ${company.name}`);
        errors++;
        continue;
      }
      
      // Update the company
      const updated = await updateCompanyAddress(company.id, addressData);
      
      if (updated) {
        console.log(`Updated ${company.name} with address data: ${addressData.formatted_address}`);
        success++;
      } else {
        errors++;
      }
      
      // Add delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenRequests));
      
    } catch (err) {
      console.error(`Error processing company ${company.id}:`, err.message);
      errors++;
    }
  }
  
  return { success, errors };
}

/**
 * Create geo address columns if they don't exist
 */
async function createGeoColumns() {
  try {
    // Check if geo columns exist
    const columnsResult = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'companies' AND column_name = 'geo_street'
    `);
    
    // Skip if columns already exist
    if (columnsResult.rows.length > 0) {
      console.log('Geo columns already exist, skipping creation');
      return;
    }
    
    // Add geo columns to companies table
    await query(`
      ALTER TABLE companies 
      ADD COLUMN geo_street TEXT,
      ADD COLUMN geo_city TEXT,
      ADD COLUMN geo_postal_code TEXT,
      ADD COLUMN geo_state TEXT,
      ADD COLUMN geo_state_code TEXT,
      ADD COLUMN geo_county TEXT,
      ADD COLUMN geo_country TEXT,
      ADD COLUMN geo_country_code TEXT,
      ADD COLUMN geo_formatted_address TEXT
    `);
    
    console.log('Created geo address columns in companies table');
    
  } catch (err) {
    console.error('Error creating geo columns:', err.message);
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting address enrichment from coordinates...');
    console.log('Configuration:', JSON.stringify(CONFIG, null, 2));
    
    // Create geo columns if they don't exist
    await createGeoColumns();
    
    // Get companies that need enrichment
    const companies = await getCompaniesForEnrichment();
    console.log(`Found ${companies.length} companies that need address enrichment`);
    
    // Process in batches
    const batches = [];
    for (let i = 0; i < companies.length; i += CONFIG.batchSize) {
      batches.push(companies.slice(i, i + CONFIG.batchSize));
    }
    
    console.log(`Will process in ${batches.length} batches of ${CONFIG.batchSize} companies each`);
    
    let totalSuccess = 0;
    let totalErrors = 0;
    
    // Process each batch
    for (let i = 0; i < batches.length; i++) {
      console.log(`\nProcessing batch ${i + 1} of ${batches.length}...`);
      
      const batchResults = await processBatch(batches[i]);
      
      totalSuccess += batchResults.success;
      totalErrors += batchResults.errors;
      
      console.log(`Batch ${i + 1} complete: ${batchResults.success} successes, ${batchResults.errors} errors`);
      
      // Show progress
      const progress = Math.round(((i + 1) / batches.length) * 100);
      console.log(`Overall progress: ${progress}% (${i + 1}/${batches.length} batches)`);
    }
    
    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`Total companies processed: ${companies.length}`);
    console.log(`Successful updates: ${totalSuccess}`);
    console.log(`Errors: ${totalErrors}`);
    
    // Show some stats
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(geo_city) as with_city,
        COUNT(geo_state) as with_state,
        COUNT(geo_postal_code) as with_postal_code,
        COUNT(geo_street) as with_street
      FROM companies
    `);
    
    if (statsResult.rows.length > 0) {
      const stats = statsResult.rows[0];
      console.log('\nDatabase Address Stats:');
      console.log(`Total companies: ${stats.total}`);
      console.log(`With geo street: ${stats.with_street} (${Math.round((stats.with_street / stats.total) * 100)}%)`);
      console.log(`With geo city: ${stats.with_city} (${Math.round((stats.with_city / stats.total) * 100)}%)`);
      console.log(`With geo state: ${stats.with_state} (${Math.round((stats.with_state / stats.total) * 100)}%)`);
      console.log(`With geo postal code: ${stats.with_postal_code} (${Math.round((stats.with_postal_code / stats.total) * 100)}%)`);
    }
    
  } catch (err) {
    console.error('Error in main function:', err);
  } finally {
    await pool.end();
    console.log('\nDatabase connection closed');
  }
}

// Run the script
main().catch(console.error);