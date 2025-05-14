const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// CSV file path
const CSV_FILE = path.join(process.cwd(), 'combined_filtered_hvac.csv');
const BATCH_SIZE = 50;

// Create PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// SQL for inserting a company record
const INSERT_SQL = `
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
`;

/**
 * Parse a CSV line properly handling quoted fields
 * @param {string} line - The CSV line to parse
 * @returns {string[]} - Array of parsed field values
 */
function parseCSVLine(line) {
  if (!line) return [];
  
  const result = [];
  let currentValue = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      // Handle escaped quotes (double quotes)
      if (nextChar === '"') {
        currentValue += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(currentValue);
      currentValue = '';
    } else {
      // Regular character
      currentValue += char;
    }
  }
  
  // Add the last field
  result.push(currentValue);
  
  return result;
}

/**
 * Process the CSV file line by line
 */
async function processCSV() {
  if (!fs.existsSync(CSV_FILE)) {
    console.error(`CSV file not found: ${CSV_FILE}`);
    return 0;
  }
  
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(CSV_FILE);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    let lineNumber = 0;
    let headerFields = [];
    let recordBatch = [];
    let totalImported = 0;
    let errors = 0;
    
    // Process each line
    rl.on('line', async (line) => {
      lineNumber++;
      
      // Parse the current line
      const fields = parseCSVLine(line);
      
      // Handle header
      if (lineNumber === 1) {
        headerFields = fields;
        console.log(`CSV header has ${headerFields.length} columns`);
        return;
      }
      
      try {
        // Map fields to header names
        const record = {};
        headerFields.forEach((header, index) => {
          if (index < fields.length) {
            record[header] = fields[index];
          } else {
            record[header] = '';
          }
        });
        
        // Add to batch
        recordBatch.push(record);
        
        // Process batch when it reaches the batch size
        if (recordBatch.length >= BATCH_SIZE) {
          rl.pause(); // Pause reading to process batch
          
          try {
            const result = await processBatch(recordBatch);
            totalImported += result.imported;
            errors += result.errors;
            console.log(`Processed ${lineNumber - 1} records so far. Imported: ${totalImported}, Errors: ${errors}`);
          } catch (err) {
            console.error('Error processing batch:', err);
            errors += recordBatch.length;
          }
          
          // Clear batch and resume reading
          recordBatch = [];
          rl.resume();
        }
      } catch (err) {
        console.error(`Error processing line ${lineNumber}:`, err);
        errors++;
      }
    });
    
    // Handle the end of file
    rl.on('close', async () => {
      try {
        // Process any remaining records
        if (recordBatch.length > 0) {
          const result = await processBatch(recordBatch);
          totalImported += result.imported;
          errors += result.errors;
        }
        
        console.log(`\nCSV import completed: ${totalImported} records imported, ${errors} errors`);
        resolve({ imported: totalImported, errors });
      } catch (err) {
        reject(err);
      }
    });
    
    // Handle errors
    rl.on('error', (err) => {
      console.error('Error reading CSV file:', err);
      reject(err);
    });
  });
}

/**
 * Process a batch of records
 * @param {Array} records - Array of record objects
 * @returns {Object} - Result with imported and error counts
 */
async function processBatch(records) {
  let imported = 0;
  let errors = 0;
  
  for (const record of records) {
    try {
      if (!record.id) {
        console.log('Skipping record with no ID');
        errors++;
        continue;
      }
      
      // Prepare parameters for SQL
      const params = [
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
      ];
      
      // Execute insert
      await pool.query(INSERT_SQL, params);
      imported++;
    } catch (err) {
      console.error(`Error importing record with ID ${record.id}:`, err.message);
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
    console.log('Starting direct line-by-line CSV import...');
    
    // Clean up any existing records first
    await pool.query('TRUNCATE TABLE companies');
    console.log('Cleared existing companies table');
    
    // Process the CSV file
    const result = await processCSV();
    
    // Check results
    const countResult = await pool.query('SELECT COUNT(*) FROM companies');
    console.log(`Total companies in database: ${countResult.rows[0].count}`);
    
    // Get state distribution
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
    
    // Sample data
    const sampleResult = await pool.query(`
      SELECT id, name, phone, category, city, state, place_id, phone_carrier_type
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

// Run the main function
main().catch(console.error);