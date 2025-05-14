const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Initialize PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Import transformed company data from CSV to the database
 */
async function importCompanies() {
  try {
    console.log('Starting import of all companies to PostgreSQL...');
    
    // First, check if the database is properly connected
    console.log('\nChecking database connection...');
    const dbInfo = await pool.query('SELECT current_database() as db_name, version()');
    console.log('Connected to database:', dbInfo.rows[0].db_name);
    console.log('PostgreSQL version:', dbInfo.rows[0].version);
    
    // Read the cleaned CSV file
    console.log('\nReading cleaned CSV file...');
    const csvPath = path.join(process.cwd(), 'all_companies_cleaned.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.error(`CSV file not found at ${csvPath}`);
      return;
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.trim().split('\n');
    const headerLine = lines[0];
    const columns = headerLine.split(',');
    
    console.log(`Found ${lines.length - 1} companies in CSV file`);
    console.log(`Found ${columns.length} columns in CSV file`);
    
    if (lines.length <= 1) {
      console.log('No data found in CSV file');
      return;
    }
    
    // Manual CSV parsing to handle the data properly
    const records = [];
    
    // Process all lines after the header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Split by commas, but respecting quotes
      const values = [];
      let currentValue = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (char === '"' && (j === 0 || line[j-1] !== '\\')) {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue);
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      
      // Add the last value
      values.push(currentValue);
      
      // Create record object with proper column mapping
      const record = {};
      for (let j = 0; j < columns.length; j++) {
        if (j < values.length) {
          // Remove surrounding quotes if present
          let value = values[j];
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
          }
          
          // Handle numeric fields with empty values
          if (value === '' && (
              columns[j] === 'postal_code' || 
              columns[j] === 'latitude' || 
              columns[j] === 'longitude' || 
              columns[j] === 'rating' || 
              columns[j] === 'reviews' || 
              columns[j] === 'photos_count')) {
            value = null;
          }
          
          record[columns[j]] = value;
        } else {
          record[columns[j]] = '';
        }
      }
      
      records.push(record);
    }
    
    console.log(`Successfully parsed ${records.length} records`);
    
    // Check if the companies table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'companies'
      ) as exists
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.error('Companies table does not exist. Please create the table first.');
      return;
    }
    
    // Start inserting records
    console.log('\nStarting to insert companies into the database...');
    let insertedCount = 0;
    let skippedCount = 0;
    
    // Batch size for bulk inserts
    const BATCH_SIZE = 5;
    let batch = [];
    
    for (const [index, record] of records.entries()) {
      try {
        // Prepare column names and values for the SQL query
        const columnNames = [];
        const placeholders = [];
        const values = [];
        let valueIndex = 1;
        
        // Define all the columns we want to import
        const validColumns = [
          'id', 'slug', 'subdomain', 'custom_domain', 'name', 'site', 'phone', 
          'phone_carrier_type', 'category', 'street', 'city', 'postal_code', 
          'state', 'latitude', 'longitude', 'rating', 'reviews', 'photos_count', 
          'working_hours', 'about', 'logo', 'verified', 'place_id', 
          'location_link', 'location_reviews_link', 'email_1', 
          'email_1_validator_status', 'email_1_full_name', 'facebook', 
          'instagram', 'extras', 'created_at', 'updated_at'
        ];
        
        for (const col of validColumns) {
          if (columns.includes(col)) {
            columnNames.push(`"${col}"`);
            placeholders.push(`$${valueIndex++}`);
            
            // Convert string 'true'/'false' to boolean for verified column
            if (col === 'verified') {
              values.push(record[col] === 'true');
            } else {
              values.push(record[col]);
            }
          }
        }
        
        // Add record to the current batch
        batch.push({
          columnNames,
          placeholders,
          values
        });
        
        // Process batch if batch size reached or it's the last record
        if (batch.length >= BATCH_SIZE || index === records.length - 1) {
          // Process each record in the batch
          for (const item of batch) {
            const columnString = item.columnNames.join(', ');
            const placeholderString = item.placeholders.join(', ');
            
            // Construct and execute the INSERT query
            const insertQuery = `
              INSERT INTO "companies" (${columnString})
              VALUES (${placeholderString})
            `;
            
            const result = await pool.query(insertQuery, item.values);
            if (result.rowCount > 0) {
              insertedCount++;
            } else {
              skippedCount++;
            }
          }
          
          // Reset batch
          batch = [];
          
          // Log progress
          if (index % 100 === 0 || index === records.length - 1) {
            console.log(`Progress: ${index + 1}/${records.length} (${Math.round((index + 1) / records.length * 100)}%)`);
          }
        }
      } catch (insertErr) {
        console.error(`Error inserting company at index ${index}:`, insertErr.message);
        console.error(`Company name: ${record.name || 'Unknown'}, ID: ${record.id || 'Unknown'}`);
        if (insertErr.detail) {
          console.error(`Error detail: ${insertErr.detail}`);
        }
        skippedCount++;
      }
    }
    
    console.log(`\nImport completed: Inserted ${insertedCount} companies, skipped ${skippedCount} companies`);
    
    // Verify the insert
    const countQuery = `SELECT COUNT(*) as count FROM "companies"`;
    const countResult = await pool.query(countQuery);
    console.log(`Companies table now contains ${countResult.rows[0].count} rows`);
    
  } catch (err) {
    console.error('Import failed:', err.message);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the import
importCompanies().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});