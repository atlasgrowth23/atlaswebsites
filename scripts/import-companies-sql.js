const { Pool } = require('pg');
const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');
const readline = require('readline');

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// CSV file path (using the combined filtered HVAC file)
const CSV_FILE_PATH = './companies_rows_original.csv';

// Configuration
const CONFIG = {
  batchSize: 100,        // Number of records to insert in each batch
  totalLimit: 0,         // Max records to process (0 = all)
  skipHeader: true,      // Skip the header row
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
 * Process the CSV file line by line
 */
async function processCSV() {
  return new Promise((resolve, reject) => {
    console.log(`Processing CSV file: ${CSV_FILE_PATH}`);
    
    const fileStream = fs.createReadStream(CSV_FILE_PATH);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    const records = [];
    let lineCount = 0;
    let header = [];
    
    rl.on('line', (line) => {
      lineCount++;
      
      // Skip header if configured
      if (CONFIG.skipHeader && lineCount === 1) {
        // Store header for column names
        header = parseCSVLine(line);
        return;
      }
      
      // Parse line
      const values = parseCSVLine(line);
      
      // Skip invalid lines
      if (!values || values.length !== header.length) {
        console.log(`Skipping line ${lineCount}: invalid record length (got ${values ? values.length : 0}, expected ${header.length})`);
        return;
      }
      
      // Create record object
      const record = {};
      for (let i = 0; i < header.length; i++) {
        record[header[i]] = values[i];
      }
      
      records.push(record);
      
      // Process in batches
      if (CONFIG.totalLimit > 0 && records.length >= CONFIG.totalLimit) {
        rl.close();
      }
      
      // Log progress
      if (CONFIG.verbose && lineCount % 100 === 0) {
        console.log(`Processed ${lineCount} lines...`);
      }
    });
    
    rl.on('close', () => {
      console.log(`Finished reading CSV file: ${lineCount} lines, ${records.length} valid records`);
      resolve(records);
    });
    
    rl.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Parse a CSV line properly handling quoted fields
 * @param {string} line - The CSV line to parse
 * @returns {string[]} - Array of parsed field values
 */
function parseCSVLine(line) {
  const result = [];
  let field = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"' && !inQuotes) {
      // Start of quoted field
      inQuotes = true;
    } else if (char === '"' && inQuotes && nextChar === '"') {
      // Escaped quote within quoted field
      field += '"';
      i++; // Skip the next quote
    } else if (char === '"' && inQuotes) {
      // End of quoted field
      inQuotes = false;
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(field);
      field = '';
    } else {
      // Regular character
      field += char;
    }
  }
  
  // Add the last field
  result.push(field);
  
  return result;
}

/**
 * Process a batch of records
 * @param {Array} records - Array of record objects
 * @returns {Object} - Result with inserted and error counts
 */
async function processBatch(records) {
  let inserted = 0;
  let errors = 0;
  
  // Create a transaction for all inserts
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    for (const record of records) {
      try {
        // Prepare SQL values
        const id = record.id || undefined;
        const slug = record.slug || '';
        const subdomain = record.subdomain || '';
        const custom_domain = record.custom_domain || '';
        const name = record.name || '';
        const site = record.site || '';
        const phone = record.phone || '';
        const phone_carrier_type = record.phone_carrier_type || '';
        const category = record.category || '';
        const street = record.street || '';
        const city = record.city || '';
        const postal_code = record.postal_code || '';
        const state = record.state || '';
        const latitude = record.latitude ? parseFloat(record.latitude) : null;
        const longitude = record.longitude ? parseFloat(record.longitude) : null;
        const rating = record.rating ? parseFloat(record.rating) : null;
        const reviews = record.reviews ? parseInt(record.reviews, 10) : null;
        const photos_count = record.photos_count ? parseInt(record.photos_count, 10) : null;
        const working_hours = record.working_hours || null;
        const about = record.about || null;
        const logo = record.logo || null;
        const verified = record.verified === 'true' || record.verified === 't';
        const place_id = record.place_id || null;
        const location_link = record.location_link || null;
        const location_reviews_link = record.location_reviews_link || null;
        const email_1 = record.email_1 || null;
        const email_1_validator_status = record.email_1_validator_status || null;
        const email_1_full_name = record.email_1_full_name || null;
        const facebook = record.facebook || null;
        const instagram = record.instagram || null;
        const extras = record.extras || null;
        const created_at = new Date();
        
        // Insert the record
        await client.query(`
          INSERT INTO companies (
            id, slug, subdomain, custom_domain, name, site, phone, 
            phone_carrier_type, category, street, city, postal_code, state,
            latitude, longitude, rating, reviews, photos_count, working_hours,
            about, logo, verified, place_id, location_link, location_reviews_link,
            email_1, email_1_validator_status, email_1_full_name, facebook, instagram, extras,
            created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 
            $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, 
            $29, $30, $31, $32
          )
          ON CONFLICT (id) DO UPDATE SET
            slug = EXCLUDED.slug,
            subdomain = EXCLUDED.subdomain,
            custom_domain = EXCLUDED.custom_domain,
            name = EXCLUDED.name,
            site = EXCLUDED.site,
            phone = EXCLUDED.phone,
            phone_carrier_type = EXCLUDED.phone_carrier_type,
            category = EXCLUDED.category,
            street = EXCLUDED.street,
            city = EXCLUDED.city,
            postal_code = EXCLUDED.postal_code,
            state = EXCLUDED.state,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            rating = EXCLUDED.rating,
            reviews = EXCLUDED.reviews,
            photos_count = EXCLUDED.photos_count,
            working_hours = EXCLUDED.working_hours,
            about = EXCLUDED.about,
            logo = EXCLUDED.logo,
            verified = EXCLUDED.verified,
            place_id = EXCLUDED.place_id,
            location_link = EXCLUDED.location_link,
            location_reviews_link = EXCLUDED.location_reviews_link,
            email_1 = EXCLUDED.email_1,
            email_1_validator_status = EXCLUDED.email_1_validator_status,
            email_1_full_name = EXCLUDED.email_1_full_name,
            facebook = EXCLUDED.facebook,
            instagram = EXCLUDED.instagram,
            extras = EXCLUDED.extras
        `, [
          id, slug, subdomain, custom_domain, name, site, phone, 
          phone_carrier_type, category, street, city, postal_code, state,
          latitude, longitude, rating, reviews, photos_count, working_hours,
          about, logo, verified, place_id, location_link, location_reviews_link,
          email_1, email_1_validator_status, email_1_full_name, facebook, instagram, extras,
          created_at
        ]);
        
        inserted++;
      } catch (err) {
        console.error(`Error inserting record with ID ${record.id}: ${err.message}`);
        errors++;
      }
    }
    
    await client.query('COMMIT');
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Transaction failed:', err);
    throw err;
  } finally {
    client.release();
  }
  
  return { inserted, errors };
}

/**
 * Process records in batches
 */
async function processRecords(records) {
  console.log(`Processing ${records.length} records in batches of ${CONFIG.batchSize}...`);
  
  let totalInserted = 0;
  let totalErrors = 0;
  
  // Process in batches
  for (let i = 0; i < records.length; i += CONFIG.batchSize) {
    const batch = records.slice(i, i + CONFIG.batchSize);
    console.log(`Processing batch ${Math.floor(i / CONFIG.batchSize) + 1} of ${Math.ceil(records.length / CONFIG.batchSize)}...`);
    
    const result = await processBatch(batch);
    
    totalInserted += result.inserted;
    totalErrors += result.errors;
    
    console.log(`Batch result: ${result.inserted} inserted, ${result.errors} errors`);
  }
  
  return { inserted: totalInserted, errors: totalErrors };
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting HVAC company import...');
    
    // Clean table if configured
    await cleanTable();
    
    // Process CSV file
    const records = await processCSV();
    
    // Process records
    const result = await processRecords(records);
    
    // Final summary
    console.log('\n=== IMPORT SUMMARY ===');
    console.log(`Total records: ${records.length}`);
    console.log(`Records inserted: ${result.inserted}`);
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
      console.log(`${row.state}: ${row.count}`);
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