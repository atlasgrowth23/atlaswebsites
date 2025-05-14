const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

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
 * Split the large CSV into smaller chunks for better processing
 */
async function splitCsvIntoChunks() {
  const csvFilePath = path.join(process.cwd(), 'combined_filtered_hvac.csv');
  const chunkDir = path.join(process.cwd(), 'chunks');
  const linesPerChunk = 100;
  
  try {
    // Create chunks directory if it doesn't exist
    if (!fs.existsSync(chunkDir)) {
      fs.mkdirSync(chunkDir);
    } else {
      // Clean up existing chunks
      const files = fs.readdirSync(chunkDir);
      for (const file of files) {
        fs.unlinkSync(path.join(chunkDir, file));
      }
    }
    
    // Read the header line
    const fileStream = fs.createReadStream(csvFilePath, {encoding: 'utf8'});
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    let header = null;
    let lineCounter = 0;
    let chunkCounter = 0;
    let currentChunk = [];
    
    console.log('Starting to split the CSV file into chunks...');
    
    for await (const line of rl) {
      // Extract header from first line
      if (lineCounter === 0) {
        header = line;
        lineCounter++;
        continue;
      }
      
      // Add line to current chunk
      currentChunk.push(line);
      lineCounter++;
      
      // Write chunk when it reaches the specified size or end of file
      if (currentChunk.length >= linesPerChunk) {
        const chunkPath = path.join(chunkDir, `chunk_${chunkCounter}.csv`);
        fs.writeFileSync(chunkPath, header + '\n' + currentChunk.join('\n'));
        console.log(`Wrote chunk ${chunkCounter} with ${currentChunk.length} lines`);
        
        currentChunk = [];
        chunkCounter++;
      }
    }
    
    // Write the last chunk if it has any lines
    if (currentChunk.length > 0) {
      const chunkPath = path.join(chunkDir, `chunk_${chunkCounter}.csv`);
      fs.writeFileSync(chunkPath, header + '\n' + currentChunk.join('\n'));
      console.log(`Wrote chunk ${chunkCounter} with ${currentChunk.length} lines`);
      chunkCounter++;
    }
    
    console.log(`\nSplitting completed!`);
    console.log(`Total lines: ${lineCounter}`);
    console.log(`Total chunks: ${chunkCounter}`);
    
    return {
      totalLines: lineCounter,
      totalChunks: chunkCounter,
      chunkDir
    };
    
  } catch (error) {
    console.error(`Error splitting CSV: ${error.message}`);
    throw error;
  }
}

/**
 * Create a simplified script for direct line processing
 */
async function createSimplifiedImport() {
  try {
    // Create a SQL file for importing
    const sqlFilePath = path.join(process.cwd(), 'import_companies.sql');
    
    const sqlContent = `
-- Clear the table
TRUNCATE TABLE companies RESTART IDENTITY CASCADE;

-- Import from CSV with proper handling of quoting and escaping
\\copy companies (id,slug,subdomain,custom_domain,name,site,phone,phone_carrier_type,category,street,city,postal_code,state,latitude,longitude,rating,reviews,photos_count,working_hours,about,logo,verified,place_id,location_link,location_reviews_link,email_1,email_1_validator_status,email_1_full_name,facebook,instagram,extras,created_at,updated_at) FROM './combined_filtered_hvac.csv' WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\\');

-- Count the imported records
SELECT COUNT(*) AS imported_records FROM companies;
`;
    
    fs.writeFileSync(sqlFilePath, sqlContent);
    console.log(`Created SQL import file at: ${sqlFilePath}`);
    
    // Create a shell script for execution
    const shellScriptPath = path.join(process.cwd(), 'run_import.sh');
    
    const shellContent = `#!/bin/bash
# Execute the SQL import command
export PGPASSWORD="${process.env.DATABASE_URL.split(':')[2].split('@')[0]}"
DBURL="${process.env.DATABASE_URL}"
echo "Running PSQL import..."
psql "$DBURL" -f import_companies.sql
`;
    
    fs.writeFileSync(shellScriptPath, shellContent);
    fs.chmodSync(shellScriptPath, 0o755); // Make it executable
    console.log(`Created shell script at: ${shellScriptPath}`);
    
    return {
      sqlFilePath,
      shellScriptPath
    };
    
  } catch (error) {
    console.error(`Error creating import scripts: ${error.message}`);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting preparation for direct import...');
    
    // Create simplified import files
    const importFiles = await createSimplifiedImport();
    
    console.log('\nPreparation completed successfully!');
    console.log(`
To import the CSV data, run:
  bash ${importFiles.shellScriptPath}
`);
    
  } catch (error) {
    console.error(`Error in main function: ${error.message}`);
  } finally {
    await pool.end();
  }
}

// Run the main function
main().catch(err => {
  console.error(`Unhandled error: ${err.message}`);
  process.exit(1);
});