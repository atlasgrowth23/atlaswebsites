const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { parse } = require('csv-parse');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Database connection
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
    console.error(`Error executing query: ${err.message}`);
    throw err;
  }
}

/**
 * Import companies from CSV file
 */
async function importCompanies() {
  console.log('Starting import of companies from CSV...');
  
  // Path to the CSV file
  const csvFilePath = path.join(process.cwd(), 'combined_filtered_hvac.csv');
  
  try {
    // Check if the file exists
    if (!fs.existsSync(csvFilePath)) {
      console.error(`CSV file not found at: ${csvFilePath}`);
      return;
    }
    
    console.log(`Reading CSV file: ${csvFilePath}`);
    const fileContent = fs.readFileSync(csvFilePath, 'utf8');
    
    // Parse the CSV
    const parser = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      // Use custom quote settings to handle JSON fields
      quote: '"',
      escape: '"',
      relax_column_count: true,
    });
    
    // Parse the records
    const records = [];
    for await (const record of parser) {
      records.push(record);
    }
    
    console.log(`Parsed ${records.length} records from CSV`);
    
    // Start a transaction for bulk insert
    await query('BEGIN');
    
    // Truncate the existing table
    await query('TRUNCATE TABLE companies RESTART IDENTITY CASCADE');
    
    // Get the column names from the records
    const columns = Object.keys(records[0]);
    
    // Counter for successful inserts
    let successCount = 0;
    let errorCount = 0;
    
    // Insert the records in batches
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      // Create placeholders for the batch
      const placeholderValues = batch.map((_, recordIndex) => {
        return `(${columns
          .map((_, colIndex) => `$${recordIndex * columns.length + colIndex + 1}`)
          .join(', ')})`;
      }).join(', ');
      
      // Create query parameters array
      const params = [];
      batch.forEach(record => {
        columns.forEach(col => {
          params.push(record[col] || null);
        });
      });
      
      // Build the query
      const insertQuery = `
        INSERT INTO companies (${columns.join(', ')})
        VALUES ${placeholderValues}
        ON CONFLICT (id) DO UPDATE SET
          ${columns.filter(col => col !== 'id').map(col => `${col} = EXCLUDED.${col}`).join(', ')}
      `;
      
      try {
        // Execute the query
        await query(insertQuery, params);
        successCount += batch.length;
        console.log(`Inserted ${successCount} records so far...`);
      } catch (error) {
        console.error(`Error inserting batch starting at record ${i}: ${error.message}`);
        errorCount += batch.length;
        
        // Log the failed records for debugging
        batch.forEach((record, index) => {
          try {
            console.log(`Record ${i + index} (simplified): id=${record.id}, name=${record.name}`);
          } catch (e) {
            console.log(`Cannot print record ${i + index}`);
          }
        });
      }
    }
    
    // Commit the transaction
    await query('COMMIT');
    
    console.log(`\nImport completed!`);
    console.log(`- Successfully imported: ${successCount} records`);
    console.log(`- Failed to import: ${errorCount} records`);
    
    // Check the record count in the database
    const countResult = await query('SELECT COUNT(*) FROM companies');
    console.log(`- Total records in database: ${countResult.rows[0].count}`);
    
  } catch (error) {
    console.error(`Error during import: ${error.message}`);
    
    // Rollback the transaction in case of error
    try {
      await query('ROLLBACK');
    } catch (rollbackError) {
      console.error(`Error during rollback: ${rollbackError.message}`);
    }
  } finally {
    await pool.end();
  }
}

// Run the function
importCompanies().catch(error => {
  console.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});