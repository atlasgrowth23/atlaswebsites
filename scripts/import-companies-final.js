const { Pool } = require('pg');
const fs = require('fs');
const { parse } = require('csv-parse');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// CSV file path (using the combined filtered HVAC file)
const CSV_FILE_PATH = './combined_filtered_hvac.csv';

// Configuration
const CONFIG = {
  batchSize: 50,         // Number of records to insert in each batch
  totalLimit: 0,         // Max records to process (0 = all)
  skipExisting: false,   // Skip records that already exist in DB
  cleanTable: true,      // Clean the table before import
  verbose: true          // Show detailed logs
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
    throw err;
  }
}

/**
 * Clean the companies table if configured
 */
async function cleanTable() {
  if (CONFIG.cleanTable) {
    console.log('Cleaning companies table...');
    await query('DELETE FROM companies');
    console.log('Companies table cleaned');
  }
}

/**
 * Get existing company IDs to avoid duplicates
 */
async function getExistingCompanyIds() {
  if (!CONFIG.skipExisting) {
    return new Set();
  }
  
  console.log('Getting existing company IDs...');
  const result = await query('SELECT id FROM companies');
  const ids = new Set(result.rows.map(row => row.id));
  console.log(`Found ${ids.size} existing company IDs`);
  return ids;
}

/**
 * Parse CSV file and return records
 */
async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const records = [];
    
    fs.createReadStream(filePath)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      }))
      .on('data', (record) => {
        records.push(record);
      })
      .on('error', (error) => {
        reject(error);
      })
      .on('end', () => {
        resolve(records);
      });
  });
}

/**
 * Process records in batches
 */
async function processRecords(records, existingIds) {
  const totalRecords = CONFIG.totalLimit > 0 ? 
    Math.min(records.length, CONFIG.totalLimit) : records.length;
  
  console.log(`Processing ${totalRecords} records in batches of ${CONFIG.batchSize}...`);
  
  let processed = 0;
  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  
  // Process in batches
  for (let i = 0; i < totalRecords; i += CONFIG.batchSize) {
    const batch = records.slice(i, Math.min(i + CONFIG.batchSize, totalRecords));
    
    console.log(`Processing batch ${Math.floor(i / CONFIG.batchSize) + 1} of ${Math.ceil(totalRecords / CONFIG.batchSize)}...`);
    
    const batchResult = await processBatch(batch, existingIds);
    
    processed += batchResult.processed;
    inserted += batchResult.inserted;
    skipped += batchResult.skipped;
    errors += batchResult.errors;
    
    console.log(`Batch complete: ${batchResult.processed} processed, ${batchResult.inserted} inserted, ${batchResult.skipped} skipped, ${batchResult.errors} errors`);
  }
  
  return { processed, inserted, skipped, errors };
}

/**
 * Process a batch of records
 */
async function processBatch(records, existingIds) {
  let processed = 0;
  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const record of records) {
    try {
      processed++;
      
      // Skip if already exists and skipExisting is enabled
      if (CONFIG.skipExisting && existingIds.has(record.id)) {
        if (CONFIG.verbose) {
          console.log(`Skipping record with ID ${record.id} (already exists)`);
        }
        skipped++;
        continue;
      }
      
      // Prepare column values
      const columns = [
        'id', 'slug', 'subdomain', 'custom_domain', 'name', 'site', 'phone', 
        'phone_carrier_type', 'category', 'street', 'city', 'postal_code', 'state',
        'latitude', 'longitude', 'rating', 'reviews', 'photos_count', 'working_hours',
        'about', 'logo', 'verified', 'place_id', 'location_link', 'location_reviews_link',
        'email_1', 'email_1_validator_status', 'email_1_full_name', 'facebook', 'instagram', 'extras',
        'created_at'
      ];
      
      // Prepare values and parameters
      const placeholders = columns.map((_, index) => `$${index + 1}`);
      const values = columns.map(col => {
        if (col === 'created_at') {
          return new Date();
        }
        
        let value = record[col];
        
        // Handle numeric conversions
        if (['latitude', 'longitude', 'rating'].includes(col) && value !== null && value !== undefined && value !== '') {
          return parseFloat(value);
        }
        
        if (['reviews', 'photos_count'].includes(col) && value !== null && value !== undefined && value !== '') {
          return parseInt(value, 10);
        }
        
        // Handle JSON fields
        if (['working_hours', 'about', 'extras'].includes(col) && value !== null && value !== undefined && value !== '') {
          if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
            try {
              return value; // Already a JSON string
            } catch (e) {
              return value;
            }
          }
          return value;
        }
        
        return value;
      });
      
      // Build query with ON CONFLICT
      const query = `
        INSERT INTO companies (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
        ON CONFLICT (id) DO UPDATE SET
        ${columns.filter(col => col !== 'id').map((col, i) => `${col} = EXCLUDED.${col}`).join(', ')}
      `;
      
      // Execute the query
      await pool.query(query, values);
      
      inserted++;
      
      if (CONFIG.verbose && processed % 10 === 0) {
        console.log(`Processed ${processed} records so far`);
      }
      
    } catch (err) {
      console.error(`Error processing record: ${err.message}`);
      errors++;
    }
  }
  
  return { processed, inserted, skipped, errors };
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting HVAC company import...');
    console.log(`Using CSV file: ${CSV_FILE_PATH}`);
    console.log('Configuration:', JSON.stringify(CONFIG, null, 2));
    
    // Clean table if configured
    await cleanTable();
    
    // Get existing IDs
    const existingIds = await getExistingCompanyIds();
    
    // Parse CSV file
    console.log('Parsing CSV file...');
    const records = await parseCSV(CSV_FILE_PATH);
    console.log(`CSV parsed: ${records.length} records found`);
    
    // Process records
    const result = await processRecords(records, existingIds);
    
    // Final summary
    console.log('\n=== IMPORT SUMMARY ===');
    console.log(`Total records processed: ${result.processed}`);
    console.log(`Records inserted: ${result.inserted}`);
    console.log(`Records skipped: ${result.skipped}`);
    console.log(`Errors: ${result.errors}`);
    
    // Get count from database
    const countResult = await query('SELECT COUNT(*) FROM companies');
    console.log(`Total companies in database: ${countResult.rows[0].count}`);
    
    // Get distribution by state
    const stateResult = await query(`
      SELECT state, COUNT(*) as count
      FROM companies
      WHERE state IS NOT NULL AND state != ''
      GROUP BY state
      ORDER BY count DESC
    `);
    
    console.log('\nCompanies by state:');
    stateResult.rows.forEach(row => {
      console.log(`${row.state}: ${row.count} companies`);
    });
    
  } catch (err) {
    console.error('Error in main function:', err);
  } finally {
    await pool.end();
    console.log('Database connection closed');
  }
}

// Run the script
main().catch(console.error);