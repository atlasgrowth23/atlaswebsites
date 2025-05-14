const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// CSV file path
const CSV_FILE = path.join(process.cwd(), 'combined_filtered_hvac.csv');

// Create PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Execute a database query with error handling
 */
async function executeQuery(text, params = []) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (err) {
    console.error(`Error executing query: ${err.message}`);
    console.error('Query was:', text);
    console.error('Params were:', params);
    throw err;
  }
}

/**
 * Process and import a CSV file properly using csv-parse
 */
async function importCsv() {
  console.log(`Importing CSV file: ${CSV_FILE}`);
  
  if (!fs.existsSync(CSV_FILE)) {
    console.error(`CSV file not found: ${CSV_FILE}`);
    return;
  }
  
  // Read the file content
  const fileContent = fs.readFileSync(CSV_FILE, 'utf8');
  
  // Parse the CSV properly with appropriate options
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    skip_records_with_error: true,
    // Handle quoted fields correctly
    relax_quotes: true,
    relax_column_count: true
  });
  
  console.log(`Successfully parsed ${records.length} records from CSV`);
  
  // Import records in batches
  const BATCH_SIZE = 50;
  let imported = 0;
  let errors = 0;
  
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(records.length / BATCH_SIZE)} (records ${i + 1}-${Math.min(i + BATCH_SIZE, records.length)})`);
    
    for (const record of batch) {
      try {
        // Map CSV fields to database columns with proper handling
        await executeQuery(`
          INSERT INTO companies (
            id, slug, subdomain, custom_domain, name, site, phone, phone_carrier_type,
            category, street, city, postal_code, state, latitude, longitude, rating,
            reviews, photos_count, working_hours, about, logo, verified, place_id,
            location_link, location_reviews_link, email_1, email_1_validator_status,
            email_1_full_name, facebook, instagram, extras, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
            $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
            $29, $30, $31, $32, $33
          )
        `, [
          record.id || '',
          record.slug || '',
          record.subdomain || '',
          record.custom_domain || '',
          record.name || '',
          record.site || '',
          record.phone || '',
          record.phone_carrier_type || '',
          record.category || '',
          record.street || '',
          record.city || '',
          record.postal_code || '',
          record.state || '',
          record.latitude ? parseFloat(record.latitude) : null,
          record.longitude ? parseFloat(record.longitude) : null,
          record.rating ? parseFloat(record.rating) : null,
          record.reviews ? parseInt(record.reviews) : null,
          record.photos_count ? parseInt(record.photos_count) : null,
          record.working_hours || null,
          record.about || null,
          record.logo || '',
          record.verified === 'true' || record.verified === true,
          record.place_id || '',
          record.location_link || '',
          record.location_reviews_link || '',
          record.email_1 || '',
          record.email_1_validator_status || '',
          record.email_1_full_name || '',
          record.facebook || '',
          record.instagram || '',
          record.extras || null,
          record.created_at || null,
          record.updated_at || null
        ]);
        
        imported++;
      } catch (err) {
        console.error(`Error importing record ${i}: ${err.message}`);
        errors++;
      }
    }
    
    console.log(`Imported ${imported} records so far (${errors} errors)`);
  }
  
  console.log(`\nImport completed: ${imported} records imported successfully, ${errors} errors`);
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting CSV import...');
    
    // Import the CSV data
    await importCsv();
    
    // Verify the import results
    const countResult = await executeQuery('SELECT COUNT(*) FROM companies');
    console.log(`Total companies in database: ${countResult.rows[0].count}`);
    
    // Get state distribution
    const stateResult = await executeQuery(`
      SELECT state, COUNT(*) as count
      FROM companies
      WHERE state IS NOT NULL AND state != ''
      GROUP BY state
      ORDER BY count DESC
      LIMIT 10
    `);
    
    console.log('\nCompanies by state:');
    stateResult.rows.forEach(row => {
      console.log(`${row.state}: ${row.count}`);
    });
    
    // List some fields to verify correct import
    const sampleResult = await executeQuery(`
      SELECT id, name, phone, category, state, place_id
      FROM companies
      LIMIT 5
    `);
    
    console.log('\nSample records:');
    console.table(sampleResult.rows);
    
  } catch (err) {
    console.error('Error in main function:', err);
  } finally {
    await pool.end();
    console.log('Database connection closed');
  }
}

main().catch(console.error);