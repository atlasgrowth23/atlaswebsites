const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const { parse } = require('csv-parse/sync');

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
      working_hours TEXT,
      about TEXT,
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
      extras TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  await pool.query(createTableSQL);
  console.log('Ensured companies table exists');
  
  // Add indexes
  try {
    await pool.query('CREATE INDEX IF NOT EXISTS idx_companies_place_id ON companies(place_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_companies_state ON companies(state);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_companies_city ON companies(city);');
    console.log('Ensured indexes exist');
  } catch (err) {
    console.log('Note: some indexes may already exist');
  }
}

/**
 * Fix state data for records
 */
async function cleanStateData() {
  console.log('Cleaning state data for records with invalid states...');
  
  // Get records with numeric or missing state values
  const invalidStates = await pool.query(`
    SELECT id, state, postal_code, city, latitude, longitude
    FROM companies
    WHERE state ~ '^[0-9]+$' OR state IS NULL OR state = ''
  `);
  
  console.log(`Found ${invalidStates.rows.length} records with invalid state data`);
  
  // Update each record with state derived from postal code
  let updatedCount = 0;
  
  for (const record of invalidStates.rows) {
    let state = 'Unknown';
    
    // Try to determine state from postal code
    if (record.postal_code) {
      const postalPrefix = record.postal_code.substring(0, 2);
      if (postalPrefix >= '35' && postalPrefix <= '36') {
        state = 'Alabama';
      } else if (postalPrefix >= '71' && postalPrefix <= '72') {
        state = 'Arkansas';
      } else if (postalPrefix >= '30' && postalPrefix <= '31') {
        state = 'Georgia';
      } else if (postalPrefix >= '37' && postalPrefix <= '38') {
        state = 'Tennessee';
      } else if (postalPrefix >= '73' && postalPrefix <= '74') {
        state = 'Oklahoma';
      } else if (postalPrefix >= '75' && postalPrefix <= '79') {
        state = 'Texas';
      } else if (postalPrefix >= '32' && postalPrefix <= '34') {
        state = 'Florida';
      }
    }
    
    // Update the record
    await pool.query(
      'UPDATE companies SET state = $1 WHERE id = $2',
      [state, record.id]
    );
    
    updatedCount++;
    if (updatedCount % 50 === 0) {
      console.log(`Updated ${updatedCount} state values so far...`);
    }
  }
  
  console.log(`Completed state data cleaning. Updated ${updatedCount} records.`);
}

/**
 * Import a CSV file directly to database with minimal processing
 */
async function importCsvFile(filePath, sourceLabel) {
  console.log(`Importing ${sourceLabel} companies from ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }
  
  // Read file content
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const lines = fileContent.split('\n').filter(line => line.trim().length > 0);
  const headers = lines[0].split(',');
  
  console.log(`Found ${lines.length - 1} ${sourceLabel} companies to process`);
  
  let added = 0;
  let skipped = 0;
  let errors = 0;
  
  for (let i = 1; i < lines.length; i++) {
    if (i % 50 === 0) {
      console.log(`Processing line ${i}/${lines.length - 1}...`);
    }
    
    try {
      const line = lines[i];
      const values = parseCsvLine(line);
      
      if (values.length !== headers.length) {
        console.log(`Line ${i} has ${values.length} values, expected ${headers.length}. Skipping.`);
        skipped++;
        continue;
      }
      
      const record = {};
      for (let j = 0; j < headers.length; j++) {
        record[headers[j].trim()] = values[j];
      }
      
      // Check if record already exists
      const checkResult = await pool.query(
        'SELECT id FROM companies WHERE id = $1',
        [record.id]
      );
      
      if (checkResult.rows.length > 0) {
        skipped++;
        continue;
      }
      
      // Clean up numeric fields
      const latitude = record.latitude === '' ? null : parseFloat(record.latitude) || null;
      const longitude = record.longitude === '' ? null : parseFloat(record.longitude) || null;
      const rating = record.rating === '' ? null : parseFloat(record.rating) || null;
      const reviews = record.reviews === '' ? null : parseInt(record.reviews) || null;
      const photos_count = record.photos_count === '' ? null : parseInt(record.photos_count) || null;
      const verified = record.verified === 'true' || record.verified === 'TRUE';
      
      // Insert record with proper typing
      await pool.query(`
        INSERT INTO companies (
          id, slug, subdomain, custom_domain, name, site, phone, phone_carrier_type,
          category, street, city, postal_code, state, latitude, longitude,
          rating, reviews, photos_count, working_hours, about, logo, verified,
          place_id, location_link, location_reviews_link, email_1,
          email_1_validator_status, email_1_full_name, facebook, instagram,
          extras, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
          $29, $30, $31, $32, $33
        )
      `, [
        record.id,
        record.slug,
        record.subdomain,
        record.custom_domain,
        record.name,
        record.site,
        record.phone,
        record.phone_carrier_type,
        record.category,
        record.street,
        record.city,
        record.postal_code,
        record.state,
        latitude,
        longitude,
        rating,
        reviews,
        photos_count,
        record.working_hours,
        record.about,
        record.logo,
        verified,
        record.place_id,
        record.location_link,
        record.location_reviews_link,
        record.email_1,
        record.email_1_validator_status,
        record.email_1_full_name,
        record.facebook,
        record.instagram,
        record.extras,
        record.created_at || new Date().toISOString(),
        record.updated_at || new Date().toISOString()
      ]);
      
      added++;
      
    } catch (err) {
      console.error(`Error on line ${i}:`, err.message);
      errors++;
    }
  }
  
  console.log(`Import summary for ${sourceLabel}:`);
  console.log(`Total lines: ${lines.length - 1}`);
  console.log(`Added: ${added}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
  
  return { added, skipped, errors };
}

/**
 * Parse a CSV line handling quoted fields
 */
function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  values.push(current);
  
  // Clean up quoted values
  return values.map(value => {
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }
    return value;
  });
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting fixed database import...');
    
    // Ensure database structure
    await ensureCompaniesTable();
    
    // Check current count
    const initialCount = await pool.query('SELECT COUNT(*) FROM companies');
    console.log(`Initial company count: ${initialCount.rows[0].count}`);
    
    // Import Alabama companies
    await importCsvFile(
      path.join(process.cwd(), 'filtered_companies_cleaned.csv'),
      'Alabama'
    );
    
    // Import Arkansas companies
    await importCsvFile(
      path.join(process.cwd(), 'arkansas_filtered.csv'),
      'Arkansas'
    );
    
    // Clean state data
    await cleanStateData();
    
    // Final counts
    const finalCount = await pool.query('SELECT COUNT(*) FROM companies');
    console.log(`\nFinal company count: ${finalCount.rows[0].count}`);
    console.log(`Added ${finalCount.rows[0].count - initialCount.rows[0].count} new companies`);
    
    // State distribution
    const stateQuery = await pool.query(`
      SELECT state, COUNT(*) as count
      FROM companies
      GROUP BY state
      ORDER BY count DESC
    `);
    
    console.log('\nCompanies by state:');
    stateQuery.rows.forEach(row => {
      console.log(`${row.state || 'Unknown'}: ${row.count}`);
    });
    
    // Companies with place_ids
    const placeIdQuery = await pool.query(`
      SELECT COUNT(*) as count
      FROM companies
      WHERE place_id IS NOT NULL AND place_id != ''
    `);
    
    console.log(`\nCompanies with place_ids: ${placeIdQuery.rows[0].count}`);
    
  } catch (err) {
    console.error('Error in main function:', err);
  } finally {
    await pool.end();
    console.log('Database connection closed');
  }
}

// Run the script
main().catch(console.error);