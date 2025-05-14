const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
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
 * Execute a query with error handling
 */
async function query(text, params = []) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (err) {
    console.error(`Error executing query: ${text}`);
    console.error(err.message);
    return null;
  }
}

/**
 * Simple function to parse a CSV line
 * Handles basic quoting but might not work for all edge cases
 */
function parseCSVLine(line) {
  const result = [];
  let insideQuotes = false;
  let currentValue = '';
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      result.push(currentValue);
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  // Add the last value
  result.push(currentValue);
  
  return result;
}

/**
 * Process and import companies from CSV using line-by-line processing
 */
async function importCompanies() {
  console.log(`Importing companies from ${CSV_FILE}...`);
  
  // Read CSV file
  if (!fs.existsSync(CSV_FILE)) {
    console.error(`CSV file not found: ${CSV_FILE}`);
    return;
  }
  
  // Read file content
  const content = fs.readFileSync(CSV_FILE, 'utf8');
  
  // Split into lines
  const lines = content.split('\n').filter(line => line.trim());
  
  // Get header line
  const headerLine = lines[0];
  const headers = headerLine.split(',');
  
  console.log(`Found ${lines.length - 1} companies in CSV file`);
  console.log(`CSV has ${headers.length} columns`);
  
  // Insert companies
  let inserted = 0;
  let errors = 0;
  
  // Process each line (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    try {
      // Parse this line into fields
      const fields = parseCSVLine(line);
      
      // Create record object from headers and fields
      const record = {};
      headers.forEach((header, index) => {
        if (index < fields.length) {
          record[header] = fields[index];
        }
      });
      
      // Skip records without an ID
      if (!record.id) {
        console.warn(`Line ${i}: Skipping record without ID`);
        continue;
      }
      
      // Insert into database
      await query(`
        INSERT INTO companies (
          id, slug, subdomain, custom_domain, name, site, phone, phone_carrier_type, 
          category, street, city, postal_code, state, latitude, longitude, 
          rating, reviews, photos_count, working_hours, about, logo, verified, 
          place_id, location_link, location_reviews_link, email_1, 
          email_1_validator_status, email_1_full_name, facebook, instagram, 
          extras, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, $33
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          state = EXCLUDED.state,
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
        record.postal_code || 0, 
        record.state || '', 
        parseFloat(record.latitude || 0) || 0, 
        parseFloat(record.longitude || 0) || 0, 
        parseFloat(record.rating || 0) || 0, 
        parseInt(record.reviews || 0) || 0, 
        parseInt(record.photos_count || 0) || 0, 
        record.working_hours || '{}', 
        record.about || '{}', 
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
        record.extras || '{}', 
        record.created_at || new Date().toISOString(), 
        record.updated_at || new Date().toISOString()
      ]);
      
      inserted++;
      
      if (inserted % 50 === 0 || i === lines.length - 1) {
        console.log(`Processed ${i} of ${lines.length - 1} lines, imported ${inserted} companies...`);
      }
    } catch (err) {
      console.error(`Error processing line ${i}:`, err.message);
      errors++;
    }
  }
  
  console.log(`\nImport completed: ${inserted} companies imported, ${errors} errors`);
}

/**
 * Using a simpler approach with string splitting
 */
async function importCompaniesSimpler() {
  console.log(`Importing companies from ${CSV_FILE} using simpler approach...`);
  
  // Read CSV file
  if (!fs.existsSync(CSV_FILE)) {
    console.error(`CSV file not found: ${CSV_FILE}`);
    return;
  }
  
  // Read file content line by line
  const content = fs.readFileSync(CSV_FILE, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  
  // Parse header
  const headers = lines[0].split(',');
  console.log(`Found ${lines.length - 1} companies in CSV file`);
  
  // Process each line
  let inserted = 0;
  let errors = 0;
  let skipped = 0;
  
  for (let i = 1; i < lines.length; i++) {
    try {
      // Simple split by comma (not perfect for quoted fields with commas)
      const values = lines[i].split(',');
      
      // Map to headers
      const record = {};
      for (let j = 0; j < headers.length && j < values.length; j++) {
        record[headers[j]] = values[j] || '';
      }
      
      // Skip if no ID
      if (!record.id) {
        skipped++;
        continue;
      }
      
      // Only use a subset of fields to minimize issues
      await query(`
        INSERT INTO companies (
          id, name, phone, category, city, state, postal_code, 
          latitude, longitude, rating, reviews, place_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          category = EXCLUDED.category,
          state = EXCLUDED.state,
          place_id = EXCLUDED.place_id
      `, [
        record.id,
        record.name || '',
        record.phone || '',
        record.category || '',
        record.city || '',
        record.state || '',
        record.postal_code || 0,
        parseFloat(record.latitude || 0) || 0,
        parseFloat(record.longitude || 0) || 0,
        parseFloat(record.rating || 0) || 0,
        parseInt(record.reviews || 0) || 0,
        record.place_id || ''
      ]);
      
      inserted++;
      
      if (inserted % 50 === 0 || i === lines.length - 1) {
        console.log(`Processed ${i} of ${lines.length - 1} lines, inserted ${inserted} companies...`);
      }
    } catch (err) {
      console.error(`Error processing line ${i}:`, err.message);
      errors++;
    }
  }
  
  console.log(`\nImport completed: ${inserted} companies imported, ${errors} errors, ${skipped} skipped`);
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting direct companies import...');
    
    // Import companies using simpler approach
    await importCompaniesSimpler();
    
    // Count companies
    const countResult = await query('SELECT COUNT(*) FROM companies');
    console.log(`Total companies in database: ${countResult.rows[0].count}`);
    
    // Get state distribution
    const stateResult = await query(`
      SELECT state, COUNT(*) as company_count
      FROM companies
      WHERE state IS NOT NULL AND state != ''
      GROUP BY state
      ORDER BY company_count DESC
      LIMIT 10
    `);
    
    console.log('\nCompanies by state (top 10):');
    stateResult.rows.forEach(row => {
      console.log(`${row.state}: ${row.company_count}`);
    });
    
    // Count by phone_carrier_type
    const phoneTypeResult = await query(`
      SELECT phone_carrier_type, COUNT(*) as company_count
      FROM companies
      WHERE phone_carrier_type IS NOT NULL AND phone_carrier_type != ''
      GROUP BY phone_carrier_type
      ORDER BY company_count DESC
    `);
    
    console.log('\nCompanies by phone carrier type:');
    phoneTypeResult.rows.forEach(row => {
      console.log(`${row.phone_carrier_type}: ${row.company_count}`);
    });
    
    // Get category distribution
    const categoryResult = await query(`
      SELECT category, COUNT(*) as company_count
      FROM companies
      WHERE category IS NOT NULL AND category != ''
      GROUP BY category
      ORDER BY company_count DESC
      LIMIT 10
    `);
    
    console.log('\nCompanies by category (top 10):');
    categoryResult.rows.forEach(row => {
      console.log(`${row.category}: ${row.company_count}`);
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