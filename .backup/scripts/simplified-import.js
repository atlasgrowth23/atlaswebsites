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
  
  // Parse CSV with more flexible settings
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
    trim: true,
    skip_records_with_error: true
  });
  
  console.log(`Found ${records.length} companies in CSV file`);
  
  // Debug first 2 records
  if (records.length > 0) {
    console.log("First record id:", records[0].id);
  }
  if (records.length > 1) {
    console.log("Second record id:", records[1].id);
  }
  
  // Insert companies
  let inserted = 0;
  let errors = 0;
  
  for (const record of records) {
    try {
      // Skip records without an ID
      if (!record.id) {
        console.warn('Skipping record without ID');
        continue;
      }
      
      // Map fields to database columns
      // Using the existing database schema that we just discovered
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
          extras = EXCLUDED.extras,
          updated_at = NOW()
      `, [
        record.id, 
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