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
  
  // Add index on place_id for faster lookups
  try {
    await pool.query('CREATE INDEX IF NOT EXISTS idx_companies_place_id ON companies(place_id);');
    console.log('Ensured place_id index exists');
  } catch (err) {
    console.log('Note: place_id index may already exist');
  }
  
  // Add index on state for filtering
  try {
    await pool.query('CREATE INDEX IF NOT EXISTS idx_companies_state ON companies(state);');
    console.log('Ensured state index exists');
  } catch (err) {
    console.log('Note: state index may already exist');
  }
}

/**
 * Clean state field for records with missing or incorrect state data
 */
async function cleanStateData() {
  console.log('Cleaning state data for records...');
  
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
 * Import companies from CSV files
 */
async function importCompanies() {
  console.log('Starting import of companies to PostgreSQL...');
  
  try {
    // Connect to database
    const dbInfo = await pool.query('SELECT current_database() as db_name, version()');
    console.log('Connected to database:', dbInfo.rows[0].db_name);
    console.log('PostgreSQL version:', dbInfo.rows[0].version);
    
    // Ensure table exists
    await ensureCompaniesTable();
    
    // Get current company count
    const initialCount = await pool.query('SELECT COUNT(*) FROM companies');
    console.log(`Current number of companies: ${initialCount.rows[0].count}`);
    
    // Process Alabama CSV
    console.log('\nProcessing Alabama companies...');
    const alabamaPath = path.join(process.cwd(), 'filtered_companies_cleaned.csv');
    if (fs.existsSync(alabamaPath)) {
      await importCsvFile(alabamaPath, 'Alabama');
    } else {
      console.log(`Alabama CSV file not found at ${alabamaPath}`);
    }
    
    // Process Arkansas CSV
    console.log('\nProcessing Arkansas companies...');
    const arkansasPath = path.join(process.cwd(), 'arkansas_filtered.csv');
    if (fs.existsSync(arkansasPath)) {
      await importCsvFile(arkansasPath, 'Arkansas');
    } else {
      console.log(`Arkansas CSV file not found at ${arkansasPath}`);
    }
    
    // Clean up state data
    await cleanStateData();
    
    // Get final company counts
    const finalCount = await pool.query('SELECT COUNT(*) FROM companies');
    console.log(`\nFinal number of companies: ${finalCount.rows[0].count}`);
    console.log(`Added ${finalCount.rows[0].count - initialCount.rows[0].count} new companies`);
    
    // Get counts by state
    const stateCounts = await pool.query(`
      SELECT state, COUNT(*) as count 
      FROM companies 
      GROUP BY state 
      ORDER BY count DESC
    `);
    
    console.log('\nCompany counts by state:');
    stateCounts.rows.forEach(row => {
      console.log(`${row.state || 'Unknown'}: ${row.count}`);
    });
    
  } catch (err) {
    console.error('Error during import:', err);
  } finally {
    await pool.end();
    console.log('Database connection closed');
  }
}

/**
 * Import companies from a CSV file
 */
async function importCsvFile(filePath, label) {
  console.log(`Importing from ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`CSV file not found at ${filePath}`);
    return;
  }
  
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  // Clean the content - handle extra commas in JSON fields
  const cleanedContent = prepareCSVContent(fileContent);
  
  try {
    // Parse CSV to records
    const records = parse(cleanedContent, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true, // Relaxes column count validation
      relax: true // Relaxes mode
    });
    
    console.log(`Found ${records.length} ${label} companies to import`);
    
    // Process in batches
    const batchSize = 50;
    let processed = 0;
    let skipped = 0;
    let added = 0;
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const batchResult = await processBatch(batch);
      
      processed += batch.length;
      skipped += batchResult.skipped;
      added += batchResult.added;
      
      console.log(`Processed ${processed}/${records.length} ${label} records (${added} added, ${skipped} skipped)`);
    }
    
    console.log(`\nCompleted ${label} import:`);
    console.log(`Total records: ${records.length}`);
    console.log(`Added: ${added}`);
    console.log(`Skipped: ${skipped}`);
    
  } catch (err) {
    console.error(`Error parsing ${label} CSV:`, err);
  }
}

/**
 * Prepare CSV content for parsing
 */
function prepareCSVContent(content) {
  const lines = content.split('\n');
  const header = lines[0];
  const result = [header];
  
  // Process each line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    result.push(line);
  }
  
  return result.join('\n');
}

/**
 * Process a batch of records
 */
async function processBatch(records) {
  let skipped = 0;
  let added = 0;
  
  for (const record of records) {
    try {
      // Check if company already exists
      const existingCompany = await pool.query(
        'SELECT id FROM companies WHERE id = $1 OR slug = $2',
        [record.id, record.slug]
      );
      
      if (existingCompany.rows.length > 0) {
        skipped++;
        continue;
      }
      
      // Prepare verified field
      let verified = false;
      if (typeof record.verified === 'string') {
        verified = record.verified.toLowerCase() === 'true';
      } else if (typeof record.verified === 'boolean') {
        verified = record.verified;
      }
      
      // Insert the company
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
        parseFloat(record.latitude) || null,
        parseFloat(record.longitude) || null,
        parseFloat(record.rating) || null,
        parseInt(record.reviews) || null,
        parseInt(record.photos_count) || null,
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
      console.error('Error inserting company:', err);
      skipped++;
    }
  }
  
  return { added, skipped };
}

// Run the import
importCompanies().catch(err => {
  console.error('Fatal error during import:', err);
});