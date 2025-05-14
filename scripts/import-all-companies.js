const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Constants
const CSV_FILE = path.join(process.cwd(), 'combined_filtered_hvac.csv');
const CHUNK_SIZE = 25;
const START_FROM = parseInt(process.argv[2] || 1, 10); // Can be passed as command line arg

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Process the CSV file in small chunks to prevent timeouts
 */
async function processFile() {
  console.log(`Starting import from line ${START_FROM} using chunk size ${CHUNK_SIZE}`);
  
  // Check if file exists
  if (!fs.existsSync(CSV_FILE)) {
    console.error(`CSV file not found: ${CSV_FILE}`);
    return;
  }
  
  // Count lines in file
  const totalLines = await countLines(CSV_FILE);
  console.log(`CSV file has ${totalLines} total lines (including header)`);
  
  // Process file in chunks
  const stream = fs.createReadStream(CSV_FILE);
  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity
  });
  
  let lineNum = 0;
  let headers = [];
  let records = [];
  let totalImported = 0;
  let errors = 0;
  
  for await (const line of rl) {
    lineNum++;
    
    if (lineNum === 1) {
      // Parse headers
      headers = line.split(',');
      console.log(`CSV has ${headers.length} columns`);
      continue;
    }
    
    // Skip lines until we reach START_FROM
    if (lineNum < START_FROM) {
      continue;
    }
    
    try {
      const record = parseCSVLine(line, headers);
      records.push(record);
      
      // Process in chunks to avoid timeouts
      if (records.length >= CHUNK_SIZE) {
        const results = await importBatch(records);
        totalImported += results.imported;
        errors += results.errors;
        
        console.log(`Lines ${lineNum - CHUNK_SIZE + 1}-${lineNum}: imported ${results.imported}, errors ${results.errors}`);
        console.log(`Total progress: ${Math.round((lineNum / totalLines) * 100)}% (${lineNum}/${totalLines})`);
        records = [];
      }
    } catch (err) {
      console.error(`Error processing line ${lineNum}:`, err.message);
      errors++;
    }
  }
  
  // Process any remaining records
  if (records.length > 0) {
    const results = await importBatch(records);
    totalImported += results.imported;
    errors += results.errors;
    
    console.log(`Final batch: imported ${results.imported}, errors ${results.errors}`);
  }
  
  console.log(`\nImport completed: ${totalImported} records imported, ${errors} errors`);
  console.log(`Next start position if needed: ${lineNum + 1}`);
  
  return { totalImported, errors, lastLine: lineNum };
}

/**
 * Parse a CSV line with proper handling of quoted fields
 * @param {string} line - The CSV line
 * @param {string[]} headers - Column headers
 * @returns {object} - Record object with header keys
 */
function parseCSVLine(line, headers) {
  const record = {};
  let inQuotes = false;
  let currentValue = '';
  let fieldIndex = 0;
  
  // Handle empty line
  if (!line || line.trim() === '') {
    return record;
  }

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (nextChar === '"') {
        // Handle escaped double quote
        currentValue += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      if (fieldIndex < headers.length) {
        record[headers[fieldIndex]] = currentValue;
      }
      currentValue = '';
      fieldIndex++;
    } else {
      // Regular character
      currentValue += char;
    }
  }
  
  // Add the last field
  if (fieldIndex < headers.length) {
    record[headers[fieldIndex]] = currentValue;
  }
  
  return record;
}

/**
 * Count lines in a file
 * @param {string} filePath - Path to the file
 * @returns {Promise<number>} - Number of lines
 */
async function countLines(filePath) {
  return new Promise((resolve, reject) => {
    let lineCount = 0;
    const stream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity
    });
    
    rl.on('line', () => lineCount++);
    rl.on('close', () => resolve(lineCount));
    rl.on('error', err => reject(err));
  });
}

/**
 * Import a batch of records into the database
 * @param {object[]} records - Array of record objects
 * @returns {Promise<object>} - Results with counts
 */
async function importBatch(records) {
  let imported = 0;
  let errors = 0;
  
  for (const record of records) {
    try {
      if (!record.id) {
        errors++;
        continue;
      }
      
      // Insert the record
      await pool.query(`
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
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          site = EXCLUDED.site,
          phone = EXCLUDED.phone,
          category = EXCLUDED.category,
          place_id = EXCLUDED.place_id,
          updated_at = NOW()
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
        record.created_at || new Date().toISOString(),
        record.updated_at || new Date().toISOString()
      ]);
      
      imported++;
    } catch (err) {
      console.error(`Error importing record ${record.id}:`, err.message);
      errors++;
    }
  }
  
  return { imported, errors };
}

/**
 * Main function
 */
async function main() {
  try {
    // Show start message
    console.log('Starting company import from CSV with resume capability...');
    
    // Process file
    const result = await processFile();
    
    // Check database after import
    const countResult = await pool.query('SELECT COUNT(*) FROM companies');
    console.log(`\nTotal companies in database: ${countResult.rows[0].count}`);
    
    // Sample data for verification
    const sampleResult = await pool.query(`
      SELECT id, name, phone, category, city, state, place_id
      FROM companies 
      LIMIT 5
    `);
    
    console.log('\nSample records:');
    console.table(sampleResult.rows);
    
    // Print summary
    console.log('\nImport summary:');
    console.log(`- Started from line: ${START_FROM}`);
    console.log(`- Processed to line: ${result.lastLine}`);
    console.log(`- Imported: ${result.totalImported} companies`);
    console.log(`- Errors: ${result.errors}`);
    
    // State distribution
    const stateResult = await pool.query(`
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
    
  } catch (err) {
    console.error('Error in main function:', err);
  } finally {
    await pool.end();
    console.log('\nDatabase connection closed');
  }
}

// Run the script
main().catch(console.error);