const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { parse } = require('csv-parse/sync');
const dotenv = require('dotenv');
const readline = require('readline');

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
 * Count lines in a file
 */
function countLines(filePath) {
  return new Promise((resolve, reject) => {
    let lineCount = 0;
    let readable = fs.createReadStream(filePath);
    
    readable.on('data', function(chunk) {
      let i;
      for (i = 0; i < chunk.length; ++i) {
        if (chunk[i] === 10) lineCount++;
      }
    });
    
    readable.on('end', function() {
      resolve(lineCount);
    });
    
    readable.on('error', reject);
  });
}

/**
 * Process the CSV in small chunks
 */
async function processCSV() {
  const csvFilePath = path.join(process.cwd(), 'combined_filtered_hvac.csv');
  
  try {
    // Count total lines for progress tracking
    const totalLines = await countLines(csvFilePath);
    console.log(`CSV file has ${totalLines} lines (including header)`);
    
    // Truncate the existing table
    await query('TRUNCATE TABLE companies RESTART IDENTITY CASCADE');
    console.log('Cleared existing companies table');
    
    // Read the header line
    const fileStream = fs.createReadStream(csvFilePath, {encoding: 'utf8'});
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    let header = null;
    let lineCounter = 0;
    let successCount = 0;
    let errorCount = 0;
    let currentBatch = [];
    const batchSize = 50;
    
    console.log('Starting to process the CSV file line by line...');
    
    for await (const line of rl) {
      lineCounter++;
      
      // Extract header from first line
      if (lineCounter === 1) {
        header = line.split(',');
        console.log(`Header has ${header.length} columns`);
        continue;
      }
      
      // Process data line
      try {
        const record = {};
        // Simple split - we'll build a more robust CSV parser if needed
        const columns = line.split(',');
        
        // Map columns to header names
        for (let i = 0; i < Math.min(header.length, columns.length); i++) {
          record[header[i]] = columns[i];
        }
        
        // Add to current batch
        currentBatch.push(record);
        
        // Process batch when it reaches the batch size
        if (currentBatch.length >= batchSize) {
          const result = await processBatch(currentBatch);
          successCount += result.success;
          errorCount += result.error;
          currentBatch = [];
          
          // Progress report
          console.log(`Processed ${lineCounter-1} lines, ${successCount} records imported successfully`);
        }
      } catch (err) {
        console.error(`Error processing line ${lineCounter}: ${err.message}`);
        errorCount++;
      }
    }
    
    // Process final batch
    if (currentBatch.length > 0) {
      const result = await processBatch(currentBatch);
      successCount += result.success;
      errorCount += result.error;
    }
    
    console.log('\nImport completed!');
    console.log(`Processed ${lineCounter-1} lines`);
    console.log(`- Successfully imported: ${successCount} records`);
    console.log(`- Failed to import: ${errorCount} records`);
    
    // Count records in the database
    const countResult = await query('SELECT COUNT(*) FROM companies');
    console.log(`- Total records in database: ${countResult.rows[0].count}`);
    
  } catch (error) {
    console.error(`Error during import: ${error.message}`);
  } finally {
    await pool.end();
  }
}

/**
 * Process a batch of records
 */
async function processBatch(records) {
  let success = 0;
  let error = 0;
  
  try {
    // Start a transaction
    await query('BEGIN');
    
    // Process each record in the batch
    for (const record of records) {
      try {
        // Build column and value lists
        const columns = Object.keys(record).filter(col => col && col.trim() !== '');
        const values = columns.map(col => record[col]);
        const placeholders = columns.map((_, i) => `$${i+1}`).join(', ');
        
        // Handle empty strings for numeric fields
        for (let i = 0; i < columns.length; i++) {
          if (columns[i] === 'latitude' || columns[i] === 'longitude' || 
              columns[i] === 'rating' || columns[i] === 'reviews' || 
              columns[i] === 'photos_count') {
            if (values[i] === '' || values[i] === undefined) {
              values[i] = null;
            }
          }
        }
        
        // Skip if no ID
        if (!record.id || record.id.trim() === '') {
          console.log('Skipping record with no ID');
          error++;
          continue;
        }
        
        // Build the insert query
        const insertQuery = `
          INSERT INTO companies (${columns.join(', ')})
          VALUES (${placeholders})
          ON CONFLICT (id) DO UPDATE SET
            ${columns.filter(col => col !== 'id').map((col, i) => `${col} = $${i+2}`).join(', ')}
        `;
        
        // Execute the query
        await query(insertQuery, values);
        success++;
      } catch (err) {
        console.error(`Error inserting record: ${err.message}`);
        error++;
      }
    }
    
    // Commit the transaction
    await query('COMMIT');
    
  } catch (err) {
    console.error(`Error processing batch: ${err.message}`);
    
    // Rollback on error
    try {
      await query('ROLLBACK');
    } catch (rollbackErr) {
      console.error(`Error during rollback: ${rollbackErr.message}`);
    }
    
    // Count all as errors
    error += records.length;
    success = 0;
  }
  
  return { success, error };
}

/**
 * Create a better import by using a temporary file
 */
async function createBetterImport() {
  const csvFilePath = path.join(process.cwd(), 'combined_filtered_hvac.csv');
  const tempFilePath = path.join(process.cwd(), 'temp_cleaned_hvac.csv');
  
  try {
    // Read the original file in binary mode
    const data = fs.readFileSync(csvFilePath);
    
    // Use the csv-parse library to properly parse the CSV
    const records = parse(data, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    console.log(`Successfully parsed ${records.length} records!`);
    
    // Truncate the existing table
    await query('TRUNCATE TABLE companies RESTART IDENTITY CASCADE');
    console.log('Cleared existing companies table');
    
    // Process in batches
    const batchSize = 100;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      console.log(`Processing batch ${i/batchSize + 1} of ${Math.ceil(records.length/batchSize)}`);
      
      try {
        // Start transaction
        await query('BEGIN');
        
        for (const record of batch) {
          try {
            // Build columns and values
            const columns = Object.keys(record);
            const values = columns.map(col => {
              // Handle special JSON fields that need parsing
              if ((col === 'working_hours' || col === 'about' || col === 'extras') && 
                  typeof record[col] === 'string' && record[col].trim() !== '') {
                try {
                  return JSON.parse(record[col]);
                } catch (e) {
                  return record[col];
                }
              }
              return record[col];
            });
            
            // Build placeholders for the query
            const placeholders = columns.map((_, i) => `$${i+1}`).join(', ');
            
            // Build update clause
            const updateClause = columns
              .filter(col => col !== 'id')
              .map((col, i) => `${col} = $${i+2}`)
              .join(', ');
            
            // SQL query
            const insertQuery = `
              INSERT INTO companies (${columns.join(', ')})
              VALUES (${placeholders})
              ON CONFLICT (id) DO UPDATE SET
                ${updateClause}
            `;
            
            // Execute insert
            await query(insertQuery, values);
            successCount++;
          } catch (err) {
            console.error(`Error inserting record: ${err.message}`);
            errorCount++;
          }
        }
        
        // Commit transaction
        await query('COMMIT');
        console.log(`Batch completed. Running total: ${successCount} records`);
        
      } catch (err) {
        console.error(`Error processing batch: ${err.message}`);
        
        // Rollback
        try {
          await query('ROLLBACK');
        } catch (rollbackErr) {
          console.error(`Error in rollback: ${rollbackErr.message}`);
        }
        
        errorCount += batch.length;
      }
    }
    
    console.log('\nImport completed!');
    console.log(`- Successfully imported: ${successCount} records`);
    console.log(`- Failed to import: ${errorCount} records`);
    
    // Count in database
    const countResult = await query('SELECT COUNT(*) FROM companies');
    console.log(`- Total records in database: ${countResult.rows[0].count}`);
    
  } catch (error) {
    console.error(`Error during better import: ${error.message}`);
  } finally {
    // Clean up temp file if it exists
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    await pool.end();
  }
}

// Run the main function
createBetterImport().catch(err => {
  console.error(`Unhandled error: ${err.message}`);
  process.exit(1);
});