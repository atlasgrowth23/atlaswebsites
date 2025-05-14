const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Initialize PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Configuration parameters
const CHUNK_SIZE = 100;    // Number of lines to process in each chunk
const BATCH_SIZE = 10;     // Number of records to insert in each batch
const START_LINE = 1;      // Line to start from (1 is first line after header)

/**
 * Import companies from CSV in chunks to avoid memory issues
 */
async function importCompaniesInChunks() {
  try {
    console.log('Starting import of companies to PostgreSQL in chunks...');
    
    // First, check if the database is properly connected
    console.log('\nChecking database connection...');
    const dbInfo = await pool.query('SELECT current_database() as db_name, version()');
    console.log('Connected to database:', dbInfo.rows[0].db_name);
    console.log('PostgreSQL version:', dbInfo.rows[0].version);
    
    // Read CSV file header
    console.log('\nReading CSV header...');
    const csvPath = path.join(process.cwd(), 'all_companies_cleaned.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.error(`CSV file not found at ${csvPath}`);
      return;
    }
    
    // Get the total number of lines in the file
    const fileContent = fs.readFileSync(csvPath, 'utf8');
    const allLines = fileContent.trim().split('\n');
    const totalLines = allLines.length;
    const headerLine = allLines[0];
    const columns = headerLine.split(',');
    
    console.log(`CSV file has ${totalLines - 1} companies and ${columns.length} columns`);
    
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
    
    let totalInserted = 0;
    let totalSkipped = 0;
    
    // Process the file in chunks
    for (let startLine = START_LINE; startLine < totalLines; startLine += CHUNK_SIZE) {
      const endLine = Math.min(startLine + CHUNK_SIZE, totalLines);
      console.log(`\nProcessing chunk from line ${startLine} to ${endLine - 1} (${Math.round((startLine / totalLines) * 100)}% complete)`);
      
      // Process lines in this chunk
      const records = [];
      
      for (let i = startLine; i < endLine; i++) {
        const line = allLines[i].trim();
        if (!line) continue;
        
        // Parse CSV line
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
        
        // Create record object
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
      
      console.log(`Parsed ${records.length} records in current chunk`);
      
      // Insert records in batches
      let insertedCount = 0;
      let skippedCount = 0;
      let batch = [];
      
      for (const [index, record] of records.entries()) {
        try {
          // Prepare values for INSERT
          const validColumns = [
            'id', 'slug', 'subdomain', 'custom_domain', 'name', 'site', 'phone', 
            'phone_carrier_type', 'category', 'street', 'city', 'postal_code', 
            'state', 'latitude', 'longitude', 'rating', 'reviews', 'photos_count', 
            'working_hours', 'about', 'logo', 'verified', 'place_id', 
            'location_link', 'location_reviews_link', 'email_1', 
            'email_1_validator_status', 'email_1_full_name', 'facebook', 
            'instagram', 'extras', 'created_at', 'updated_at'
          ];
          
          const columnNames = [];
          const placeholders = [];
          const values = [];
          let valueIndex = 1;
          
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
          
          batch.push({
            columnNames,
            placeholders,
            values
          });
          
          // Process batch if batch size reached or it's the last record
          if (batch.length >= BATCH_SIZE || index === records.length - 1) {
            for (const item of batch) {
              const columnString = item.columnNames.join(', ');
              const placeholderString = item.placeholders.join(', ');
              
              // Insert query without ON CONFLICT clause
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
          }
        } catch (insertErr) {
          console.error(`Error inserting company at line ${startLine + index}:`, insertErr.message);
          console.error(`Company name: ${record.name || 'Unknown'}, ID: ${record.id || 'Unknown'}`);
          skippedCount++;
        }
      }
      
      totalInserted += insertedCount;
      totalSkipped += skippedCount;
      
      console.log(`Chunk results: Inserted ${insertedCount}, skipped ${skippedCount}`);
      console.log(`Running totals: Inserted ${totalInserted}, skipped ${totalSkipped}`);
    }
    
    // Verify the insert
    const countQuery = `SELECT COUNT(*) as count FROM "companies"`;
    const countResult = await pool.query(countQuery);
    console.log(`\nImport completed: Inserted ${totalInserted} companies, skipped ${totalSkipped} companies`);
    console.log(`Companies table now contains ${countResult.rows[0].count} rows`);
    
  } catch (err) {
    console.error('Import failed:', err.message);
  } finally {
    await pool.end();
  }
}

// Run the import
importCompaniesInChunks().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});