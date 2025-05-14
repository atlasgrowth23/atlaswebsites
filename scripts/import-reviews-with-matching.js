const fs = require('fs');
const { parse } = require('csv-parse');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

// Create a PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function lookupCompanyId(companyName, city) {
  try {
    // Try to find a company match by name
    let query = `SELECT id FROM companies WHERE name ILIKE $1`;
    let params = [`%${companyName}%`];
    
    // If city is provided, use it for more accurate matching
    if (city) {
      query = `SELECT id FROM companies WHERE name ILIKE $1 AND city ILIKE $2`;
      params = [`%${companyName}%`, `%${city}%`];
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length > 0) {
      return result.rows[0].id;
    } else {
      // If no exact match, try a more flexible search
      const fuzzyQuery = `SELECT id, name FROM companies WHERE name ILIKE $1 ORDER BY length(name) ASC LIMIT 1`;
      const fuzzyResult = await pool.query(fuzzyQuery, [`%${companyName.split(' ')[0]}%`]);
      
      if (fuzzyResult.rows.length > 0) {
        console.log(`Fuzzy matched ${companyName} to ${fuzzyResult.rows[0].name}`);
        return fuzzyResult.rows[0].id;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error looking up company:', error);
    return null;
  }
}

async function importReviews() {
  try {
    // For this example, we'll assume reviews have a business name in their metadata
    // You'll need to adapt this to your actual data structure
    const PLACE_ID = 'google_place_id_sample';
    const COMPANY_NAME = "1st Choice Heating and Cooling"; // Sample company name
    const CITY = ""; // Add city if you have it
    
    // Try to find company ID - replace this with your logic to match reviews to companies
    const companyId = await lookupCompanyId(COMPANY_NAME, CITY);
    
    if (!companyId) {
      console.error(`Could not find a company match for "${COMPANY_NAME}"`);
      process.exit(1);
    }
    
    console.log(`Found company ID: ${companyId} for "${COMPANY_NAME}"`);
    console.log('Starting import process...');
    
    // Path to the CSV file
    const csvFilePath = path.join(__dirname, '../CompanyData/sample-reviews.csv');
    
    console.log(`Reading file: ${csvFilePath}`);
    
    // Create a readable stream from the CSV file
    const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
    
    // Parse the CSV file
    parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }, async (err, records) => {
      if (err) {
        console.error('Error parsing CSV:', err);
        process.exit(1);
      }
      
      console.log(`Found ${records.length} reviews to import`);
      
      // Begin a transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Loop through each record and insert into the database
        for (const record of records) {
          // Map CSV fields to database fields
          const query = `
            INSERT INTO company_reviews (
              review_id, 
              company_id, 
              place_id, 
              reviewer_name, 
              rating, 
              review_text, 
              published_at, 
              reviewer_photo, 
              response_text, 
              response_date, 
              review_url
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (review_id) DO UPDATE 
            SET 
              reviewer_name = EXCLUDED.reviewer_name,
              rating = EXCLUDED.rating,
              review_text = EXCLUDED.review_text,
              published_at = EXCLUDED.published_at,
              reviewer_photo = EXCLUDED.reviewer_photo,
              response_text = EXCLUDED.response_text,
              response_date = EXCLUDED.response_date,
              review_url = EXCLUDED.review_url
          `;
          
          const values = [
            record.review_id,
            companyId,
            PLACE_ID,
            record.reviewer_name || null,
            record.rating ? parseInt(record.rating) : null,
            record.review_text || null,
            record.published_at ? new Date(record.published_at) : null,
            record.reviewer_photo || null,
            record.response_text || null,
            record.response_date ? new Date(record.response_date) : null,
            record.review_url || null
          ];
          
          await client.query(query, values);
        }
        
        // Commit the transaction
        await client.query('COMMIT');
        console.log('Successfully imported reviews');
      } catch (error) {
        // Rollback the transaction in case of an error
        await client.query('ROLLBACK');
        console.error('Error importing reviews:', error);
      } finally {
        // Release the client back to the pool
        client.release();
        process.exit(0);
      }
    });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the import function
importReviews();