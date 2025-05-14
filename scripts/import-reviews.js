const fs = require('fs');
const { parse } = require('csv-parse');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

// Create a PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function importReviews() {
  try {
    // Set the place_id (replace this with the actual ID if you have it)
    // For now, we'll use a placeholder since the sample data doesn't have it
    const PLACE_ID = 'google_place_id_sample';
    const COMPANY_ID = '1'; // Placeholder - you'll need to specify which company these reviews belong to
    
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
            COMPANY_ID,
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