
const { Pool } = require('pg');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Create PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon PostgreSQL
  }
});

async function extractPlaceIds() {
  try {
    console.log('Connecting to database...');
    
    // Query to get all place_ids, filtering out nulls and empty strings
    const query = `
      SELECT place_id 
      FROM companies 
      WHERE place_id IS NOT NULL 
      AND place_id != '' 
      ORDER BY place_id
    `;
    
    const result = await pool.query(query);
    
    // Format the output: one place_id per line, no commas
    const placeIds = result.rows.map(row => row.place_id).join('\n');
    
    // Write to file
    const outputPath = path.join(__dirname, 'place-ids.txt');
    fs.writeFileSync(outputPath, placeIds);
    
    console.log(`Successfully extracted ${result.rows.length} place_ids to ${outputPath}`);
    
  } catch (error) {
    console.error('Error extracting place_ids:', error);
  } finally {
    // Close the connection
    await pool.end();
  }
}

// Run the extraction
extractPlaceIds().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
