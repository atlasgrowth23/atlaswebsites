/**
 * Reverse Geocoding Script
 * 
 * This script will:
 * 1. Add new columns to the companies table for geocoded data
 * 2. Find all companies with missing city/state but valid coordinates
 * 3. Use Google Maps API to reverse geocode the coordinates
 * 4. Update the database with the results
 */

require('dotenv').config();
const { Pool } = require('pg');
const axios = require('axios');

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Execute a database query with error handling
 */
async function query(text, params = []) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Add new geocoded columns to the companies table if they don't exist
 */
async function addGeocodedColumns() {
  console.log('Adding geocoded columns to companies table...');
  try {
    // Check if columns already exist
    const columnsResult = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'companies' 
      AND column_name IN ('geocoded_city', 'geocoded_state', 'geocoded_zip', 'geocoded_country');
    `);

    const existingColumns = columnsResult.rows.map(row => row.column_name);
    
    // Add columns that don't exist yet
    if (!existingColumns.includes('geocoded_city')) {
      await query('ALTER TABLE companies ADD COLUMN geocoded_city VARCHAR(100);');
      console.log('Added geocoded_city column');
    }
    
    if (!existingColumns.includes('geocoded_state')) {
      await query('ALTER TABLE companies ADD COLUMN geocoded_state VARCHAR(100);');
      console.log('Added geocoded_state column');
    }
    
    if (!existingColumns.includes('geocoded_zip')) {
      await query('ALTER TABLE companies ADD COLUMN geocoded_zip VARCHAR(20);');
      console.log('Added geocoded_zip column');
    }
    
    if (!existingColumns.includes('geocoded_country')) {
      await query('ALTER TABLE companies ADD COLUMN geocoded_country VARCHAR(100);');
      console.log('Added geocoded_country column');
    }
    
    console.log('All necessary columns are now present');
  } catch (error) {
    console.error('Error adding geocoded columns:', error);
    throw error;
  }
}

/**
 * Get companies with valid coordinates but missing city data
 */
async function getCompaniesNeedingGeocoding() {
  console.log('Finding companies that need geocoding...');
  try {
    const result = await query(`
      SELECT id, name, latitude, longitude 
      FROM companies 
      WHERE 
        (city IS NULL OR city = '') 
        AND 
        (latitude IS NOT NULL AND longitude IS NOT NULL)
        AND
        (geocoded_city IS NULL OR geocoded_city = '')
      LIMIT 50; -- Process in batches to avoid API limits
    `);
    
    console.log(`Found ${result.rows.length} companies needing geocoding`);
    return result.rows;
  } catch (error) {
    console.error('Error getting companies for geocoding:', error);
    throw error;
  }
}

/**
 * Reverse geocode coordinates using Google Maps API
 */
async function reverseGeocode(latitude, longitude) {
  try {
    console.log(`Reverse geocoding coordinates: ${latitude}, ${longitude}`);
    
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await axios.get(url);
    
    if (response.data.status !== 'OK') {
      console.error('Geocoding API error:', response.data.status);
      return null;
    }
    
    // Extract address components from the response
    const addressComponents = response.data.results[0]?.address_components || [];
    
    // Initialize data
    const geocodedData = {
      city: null,
      state: null,
      zip: null,
      country: null
    };
    
    // Map address components to our data structure
    addressComponents.forEach(component => {
      const types = component.types;
      
      if (types.includes('locality') || types.includes('sublocality')) {
        geocodedData.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        geocodedData.state = component.long_name;
      } else if (types.includes('postal_code')) {
        geocodedData.zip = component.long_name;
      } else if (types.includes('country')) {
        geocodedData.country = component.long_name;
      }
    });
    
    console.log('Geocoded data:', geocodedData);
    return geocodedData;
  } catch (error) {
    console.error('Error during reverse geocoding:', error);
    return null;
  }
}

/**
 * Update a company with geocoded data
 */
async function updateCompanyWithGeocodedData(companyId, geocodedData) {
  console.log(`Updating company ${companyId} with geocoded data...`);
  try {
    await query(`
      UPDATE companies 
      SET 
        geocoded_city = $1, 
        geocoded_state = $2, 
        geocoded_zip = $3, 
        geocoded_country = $4
      WHERE id = $5
    `, [
      geocodedData.city,
      geocodedData.state, 
      geocodedData.zip,
      geocodedData.country,
      companyId
    ]);
    
    console.log(`Updated company ${companyId}`);
  } catch (error) {
    console.error(`Error updating company ${companyId}:`, error);
    throw error;
  }
}

/**
 * Main function to run the geocoding process
 */
async function main() {
  try {
    console.log('Starting reverse geocoding process...');
    
    // Add new columns for geocoded data
    await addGeocodedColumns();
    
    // Get companies to process
    const companies = await getCompaniesNeedingGeocoding();
    
    // Process companies one by one to control API usage
    for (const company of companies) {
      console.log(`Processing company: ${company.name} (${company.id})`);
      
      // Ensure we have valid coordinates
      if (!company.latitude || !company.longitude) {
        console.log(`Skipping company ${company.id}: Missing coordinates`);
        continue;
      }
      
      // Geocode coordinates
      const geocodedData = await reverseGeocode(company.latitude, company.longitude);
      
      // If geocoding succeeded, update the company data
      if (geocodedData) {
        await updateCompanyWithGeocodedData(company.id, geocodedData);
      } else {
        console.log(`Skipping company ${company.id}: Geocoding failed`);
      }
      
      // Add a small delay to avoid hitting API rate limits
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log('Geocoding process completed successfully!');
  } catch (error) {
    console.error('Error in geocoding process:', error);
  } finally {
    // Close database pool
    await pool.end();
  }
}

// Run the script
main();