const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const readline = require('readline');

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Create PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Create companies table if it doesn't exist
 */
async function ensureCompaniesTable() {
  // SQL to create the companies table
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS companies (
      id UUID PRIMARY KEY,
      slug VARCHAR(255) UNIQUE,
      subdomain VARCHAR(255),
      custom_domain VARCHAR(255),
      name VARCHAR(255) NOT NULL,
      site TEXT,
      phone VARCHAR(20),
      phone_carrier_type VARCHAR(50),
      category VARCHAR(100),
      street VARCHAR(255),
      city VARCHAR(100),
      postal_code VARCHAR(20),
      state VARCHAR(50),
      latitude DECIMAL,
      longitude DECIMAL,
      rating DECIMAL,
      reviews INTEGER,
      photos_count INTEGER,
      working_hours JSONB,
      about JSONB,
      logo TEXT,
      verified BOOLEAN,
      place_id VARCHAR(255),
      location_link TEXT,
      location_reviews_link TEXT,
      email_1 VARCHAR(255),
      email_1_validator_status VARCHAR(50),
      email_1_full_name VARCHAR(100),
      facebook TEXT,
      instagram TEXT,
      extras JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  await pool.query(createTableSQL);
  console.log('Ensured companies table exists');
}

/**
 * Process and import companies from both Alabama and Arkansas CSVs
 */
async function importCombinedCompanies() {
  console.log('Starting combined import of Alabama and Arkansas companies...');
  
  try {
    // Connect to database
    await pool.query('SELECT 1');
    console.log('Connected to PostgreSQL database');
    
    // Ensure companies table exists
    await ensureCompaniesTable();
    
    // Check if companies table already has data
    const existingCount = await pool.query('SELECT COUNT(*) FROM companies');
    console.log(`Existing companies in database: ${existingCount.rows[0].count}`);
    
    // Process Alabama companies
    console.log('\nProcessing Alabama companies...');
    const alabamaPath = path.join(process.cwd(), 'filtered_companies_cleaned.csv');
    const alabamaImportCount = await processAndImportCsv(alabamaPath, 'Alabama');
    
    // Process Arkansas companies
    console.log('\nProcessing Arkansas companies...');
    const arkansasPath = path.join(process.cwd(), 'arkansas_filtered.csv');
    const arkansasImportCount = await processAndImportCsv(arkansasPath, 'Arkansas');
    
    // Get final count
    const finalCount = await pool.query('SELECT COUNT(*) FROM companies');
    
    console.log('\nImport Summary:');
    console.log(`Alabama companies imported: ${alabamaImportCount}`);
    console.log(`Arkansas companies imported: ${arkansasImportCount}`);
    console.log(`Total companies imported: ${alabamaImportCount + arkansasImportCount}`);
    console.log(`Total companies in database: ${finalCount.rows[0].count}`);
    
  } catch (err) {
    console.error('Error during import:', err);
  } finally {
    // Close the pool
    await pool.end();
    console.log('Database connection closed');
  }
}

/**
 * Process and import records from a CSV file
 * @param {string} csvPath - Path to the CSV file
 * @param {string} source - Source label (e.g., 'Alabama', 'Arkansas')
 * @returns {number} Number of records imported
 */
async function processAndImportCsv(csvPath, source) {
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found at ${csvPath}`);
    return 0;
  }
  
  // Read CSV file
  const fileStream = fs.createReadStream(csvPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  let lineCount = 0;
  let headerColumns = [];
  let importCount = 0;
  let skipCount = 0;
  let batchSize = 50;
  let batch = [];
  
  // Process line by line
  for await (const line of rl) {
    lineCount++;
    
    // Skip empty lines
    if (!line.trim()) continue;
    
    // Process header
    if (lineCount === 1) {
      headerColumns = line.split(',');
      console.log(`CSV header has ${headerColumns.length} columns`);
      continue;
    }
    
    try {
      // Process data line
      const values = parseCSVLine(line);
      
      // Skip if we don't have enough columns
      if (values.length !== headerColumns.length) {
        console.log(`Skipping line ${lineCount} - incorrect column count: ${values.length} (expected ${headerColumns.length})`);
        skipCount++;
        continue;
      }
      
      // Create record object
      const record = {};
      for (let i = 0; i < headerColumns.length; i++) {
        let value = values[i];
        
        // Convert JSON strings to objects
        if ((headerColumns[i] === 'working_hours' || headerColumns[i] === 'about' || headerColumns[i] === 'extras') && value) {
          try {
            value = JSON.parse(value);
          } catch (e) {
            // If parsing fails, keep as string
            console.log(`Failed to parse JSON in ${headerColumns[i]} on line ${lineCount}`);
          }
        }
        
        // Convert verified to boolean
        if (headerColumns[i] === 'verified') {
          value = value === 'true';
        }
        
        record[headerColumns[i]] = value;
      }
      
      // Add to batch
      batch.push(record);
      
      // Process batch if it's full
      if (batch.length >= batchSize) {
        await insertBatch(batch);
        importCount += batch.length;
        console.log(`Imported ${importCount} ${source} records so far (${skipCount} skipped)`);
        batch = [];
      }
    } catch (err) {
      console.error(`Error processing line ${lineCount}:`, err);
      skipCount++;
    }
  }
  
  // Process any remaining records
  if (batch.length > 0) {
    await insertBatch(batch);
    importCount += batch.length;
  }
  
  console.log(`Finished processing ${source} CSV`);
  console.log(`Total lines: ${lineCount - 1}`);
  console.log(`Records imported: ${importCount}`);
  console.log(`Records skipped: ${skipCount}`);
  
  return importCount;
}

/**
 * Parse a CSV line handling quoted fields properly
 * @param {string} line - CSV line to parse
 * @returns {string[]} Array of field values
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current);
  
  // Clean up quotes from fields
  return result.map(field => {
    // Remove surrounding quotes if present
    if (field.startsWith('"') && field.endsWith('"')) {
      return field.slice(1, -1);
    }
    return field;
  });
}

/**
 * Insert a batch of records into the database
 * @param {Object[]} batch - Batch of records to insert
 */
async function insertBatch(batch) {
  // Start a transaction
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    for (const record of batch) {
      // Check if record already exists
      const checkResult = await client.query('SELECT id FROM companies WHERE id = $1', [record.id]);
      
      if (checkResult.rows.length === 0) {
        // Convert record to arrays of keys and values
        const keys = Object.keys(record);
        const values = Object.values(record);
        
        // Create placeholders $1, $2, etc.
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        
        // Create SQL query
        const insertSQL = `
          INSERT INTO companies (${keys.join(', ')})
          VALUES (${placeholders})
        `;
        
        await client.query(insertSQL, values);
      }
    }
    
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Run the import
importCombinedCompanies().catch(err => {
  console.error('Fatal error during import:', err);
});