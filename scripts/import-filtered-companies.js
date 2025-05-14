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
 * Ensure all necessary tables exist
 */
async function ensureTables() {
  console.log('Ensuring necessary tables exist...');
  
  // Create companies table if it doesn't exist
  await query(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT,
      phone TEXT,
      website TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      postal_code TEXT,
      latitude NUMERIC,
      longitude NUMERIC,
      google_rating NUMERIC,
      review_count INTEGER,
      category TEXT,
      place_id TEXT,
      phone_type TEXT,
      permanent_closed BOOLEAN,
      price_level INTEGER,
      plus_code TEXT,
      email TEXT,
      owner_id TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_companies_place_id ON companies(place_id);
    CREATE INDEX IF NOT EXISTS idx_companies_state ON companies(state);
    CREATE INDEX IF NOT EXISTS idx_companies_city ON companies(city);
    CREATE INDEX IF NOT EXISTS idx_companies_category ON companies(category);
    CREATE INDEX IF NOT EXISTS idx_companies_phone_type ON companies(phone_type);
  `);
  
  console.log('Tables ensured');
}

/**
 * Import companies from CSV
 */
async function importCompanies() {
  console.log(`Importing companies from ${CSV_FILE}...`);
  
  // Read CSV file
  if (!fs.existsSync(CSV_FILE)) {
    console.error(`CSV file not found: ${CSV_FILE}`);
    return;
  }
  
  const csvContent = fs.readFileSync(CSV_FILE, 'utf8');
  
  // Parse CSV with flexible column handling
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true
  });
  
  console.log(`Found ${records.length} companies in CSV file`);
  
  // Insert companies
  let inserted = 0;
  let errors = 0;
  
  for (const record of records) {
    try {
      // Skip records without an ID
      if (!record.id) {
        console.warn('Skipping record without ID:', record);
        continue;
      }
      
      // Handle missing fields
      const company = {
        id: record.id,
        name: record.name || '',
        phone: record.phone || '',
        website: record.website || '',
        address: record.address || '',
        city: record.city || '',
        state: record.state || '',
        postal_code: record.postal_code || record.zip_code || '',
        latitude: parseFloat(record.latitude || 0) || 0,
        longitude: parseFloat(record.longitude || 0) || 0,
        google_rating: parseFloat(record.google_rating || 0) || 0,
        review_count: parseInt(record.review_count || 0) || 0,
        category: record.category || '',
        place_id: record.place_id || '',
        phone_type: record.phone_type || '',
        permanent_closed: record.permanent_closed === 'TRUE' || record.permanent_closed === true,
        price_level: parseInt(record.price_level || 0) || 0,
        plus_code: record.plus_code || '',
        email: record.email || ''
      };
      
      // Insert or update company
      await query(`
        INSERT INTO companies (
          id, name, phone, website, address, city, state, postal_code,
          latitude, longitude, google_rating, review_count, category,
          place_id, phone_type, permanent_closed, price_level, plus_code, email
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          phone = EXCLUDED.phone,
          website = EXCLUDED.website,
          address = EXCLUDED.address,
          city = EXCLUDED.city,
          state = EXCLUDED.state,
          postal_code = EXCLUDED.postal_code,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          google_rating = EXCLUDED.google_rating,
          review_count = EXCLUDED.review_count,
          category = EXCLUDED.category,
          place_id = EXCLUDED.place_id,
          phone_type = EXCLUDED.phone_type,
          permanent_closed = EXCLUDED.permanent_closed,
          price_level = EXCLUDED.price_level,
          plus_code = EXCLUDED.plus_code,
          email = EXCLUDED.email,
          updated_at = NOW()
      `, [
        company.id, company.name, company.phone, company.website, company.address,
        company.city, company.state, company.postal_code, company.latitude, company.longitude,
        company.google_rating, company.review_count, company.category, company.place_id,
        company.phone_type, company.permanent_closed, company.price_level, company.plus_code,
        company.email
      ]);
      
      inserted++;
      
      if (inserted % 50 === 0) {
        console.log(`Imported ${inserted} companies...`);
      }
    } catch (err) {
      console.error(`Error importing company ID ${record.id}:`, err.message);
      errors++;
    }
  }
  
  console.log(`\nImport completed: ${inserted} companies imported, ${errors} errors`);
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting filtered companies import...');
    
    // Ensure tables exist
    await ensureTables();
    
    // Import companies
    await importCompanies();
    
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
    `);
    
    console.log('\nCompanies by state:');
    stateResult.rows.forEach(row => {
      console.log(`${row.state}: ${row.company_count}`);
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