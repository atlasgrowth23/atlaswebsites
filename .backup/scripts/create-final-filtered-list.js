const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

// File paths
const ALABAMA_FILE = path.join(process.cwd(), 'filtered_companies_cleaned.csv');
const ARKANSAS_FILE = path.join(process.cwd(), 'arkansas_filtered.csv');
const OUTPUT_FILE = path.join(process.cwd(), 'final_filtered_hvac.csv');

/**
 * Create the final filtered list with both Alabama and Arkansas records
 */
async function createFinalFilteredList() {
  console.log('Creating final filtered HVAC companies list...');
  
  // Check if files exist
  if (!fs.existsSync(ALABAMA_FILE)) {
    console.error(`Alabama file not found: ${ALABAMA_FILE}`);
    return;
  }
  
  if (!fs.existsSync(ARKANSAS_FILE)) {
    console.error(`Arkansas file not found: ${ARKANSAS_FILE}`);
    return;
  }
  
  // Read Alabama data using manual line processing to handle complex CSV
  console.log('Reading Alabama data...');
  
  // Count lines to get a rough estimate of records
  const alabamaContent = fs.readFileSync(ALABAMA_FILE, 'utf8');
  const alabamaLines = alabamaContent.split('\n').filter(line => line.trim()).length;
  console.log(`Alabama file has approximately ${alabamaLines - 1} records`);
  
  // Execute a shell command to count lines properly
  const { execSync } = require('child_process');
  try {
    const lineCount = execSync(`wc -l < "${ALABAMA_FILE}"`).toString().trim();
    console.log(`Alabama file line count: ${lineCount}`);
  } catch (err) {
    console.log('Could not execute wc command:', err.message);
  }
  
  // Use a more direct processing method for Alabama
  const alabamaLines2 = alabamaContent.split('\n').filter(line => line.trim());
  const alabamaHeader = alabamaLines2[0].split(',');
  console.log(`Alabama header has ${alabamaHeader.length} columns`);
  
  // Add companies from database instead of parsing the file
  console.log('Getting Alabama companies from database...');
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  let alabamaRecords = [];
  try {
    const result = await pool.query(`
      SELECT * FROM companies WHERE state = 'Alabama'
    `);
    alabamaRecords = result.rows;
    console.log(`Got ${alabamaRecords.length} Alabama companies from database`);
  } catch (err) {
    console.error('Error getting Alabama companies from database:', err.message);
    alabamaRecords = [];
  }
  
  // Read Arkansas data
  console.log('Reading Arkansas data...');
  const arkansasContent = fs.readFileSync(ARKANSAS_FILE, 'utf8');
  let arkansasRecords;
  
  try {
    arkansasRecords = parse(arkansasContent, {
      columns: true,
      skip_empty_lines: true,
      relaxColumnCount: true
    });
    console.log(`Read ${arkansasRecords.length} Arkansas records`);
  } catch (err) {
    console.error('Error parsing Arkansas CSV:', err.message);
    
    // Try simpler parsing approach
    console.log('Trying simpler parsing approach...');
    const lines = arkansasContent.split('\n').filter(line => line.trim());
    const header = lines[0].split(',');
    
    arkansasRecords = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const record = {};
      
      // Only use records that have the same number of fields as the header
      if (values.length === header.length) {
        for (let j = 0; j < header.length; j++) {
          record[header[j]] = values[j];
        }
        arkansasRecords.push(record);
      }
    }
    
    console.log(`Read ${arkansasRecords.length} Arkansas records (simple parsing)`);
  }
  
  // Combine records and write to file
  console.log('Combining records...');
  const combinedRecords = [...alabamaRecords, ...arkansasRecords];
  console.log(`Combined ${alabamaRecords.length} Alabama and ${arkansasRecords.length} Arkansas records for a total of ${combinedRecords.length} records`);
  
  // Write to file
  console.log('Writing to file...');
  const csvOutput = stringify(combinedRecords, { header: true });
  fs.writeFileSync(OUTPUT_FILE, csvOutput);
  console.log(`Final filtered list written to: ${OUTPUT_FILE}`);
  
  // Extract place_ids for review fetching
  console.log('Extracting place_ids...');
  const placeIds = combinedRecords
    .filter(record => record.place_id && record.place_id !== '')
    .map(record => record.place_id);
  
  console.log(`Found ${placeIds.length} place_ids for review fetching`);
  
  // Write place_ids to file for easier reference
  const placeIdsFile = path.join(process.cwd(), 'filtered_place_ids.txt');
  fs.writeFileSync(placeIdsFile, placeIds.join('\n'));
  console.log(`Place IDs written to: ${placeIdsFile}`);
  
  return {
    totalRecords: combinedRecords.length,
    placeIds: placeIds
  };
}

// Database utilities
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Create PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Update database with the filtered companies list
 */
async function updateDatabaseWithFilteredList() {
  console.log('\nChecking database for filtered companies...');
  
  try {
    // Count companies in database
    const countResult = await pool.query('SELECT COUNT(*) FROM companies');
    console.log(`Total companies in database: ${countResult.rows[0].count}`);
    
    // Read filtered list
    if (!fs.existsSync(OUTPUT_FILE)) {
      console.error(`Filtered file not found: ${OUTPUT_FILE}`);
      return;
    }
    
    const filteredContent = fs.readFileSync(OUTPUT_FILE, 'utf8');
    const filteredRecords = parse(filteredContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    // Create a marker table to identify filtered companies
    console.log('Creating marker for filtered companies...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS filtered_companies (
        company_id TEXT PRIMARY KEY,
        place_id TEXT,
        added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_filtered_companies_place_id ON filtered_companies(place_id);
    `);
    
    // Clear existing filtered companies
    await pool.query('TRUNCATE filtered_companies');
    
    // Insert filtered company IDs
    console.log('Inserting filtered company IDs...');
    let insertedCount = 0;
    
    for (const record of filteredRecords) {
      try {
        await pool.query(
          'INSERT INTO filtered_companies (company_id, place_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [record.id, record.place_id]
        );
        insertedCount++;
        
        if (insertedCount % 50 === 0) {
          console.log(`Inserted ${insertedCount} filtered company markers...`);
        }
      } catch (err) {
        console.error(`Error inserting filtered company marker for ${record.id}:`, err.message);
      }
    }
    
    console.log(`Inserted ${insertedCount} filtered company markers`);
    
    // Count filtered companies
    const filteredCountResult = await pool.query('SELECT COUNT(*) FROM filtered_companies');
    console.log(`Total filtered companies in database: ${filteredCountResult.rows[0].count}`);
    
  } catch (err) {
    console.error('Error updating database with filtered list:', err);
  } finally {
    await pool.end();
  }
}

/**
 * Delete unnecessary files
 */
function cleanupFiles() {
  console.log('\nCleaning up unnecessary files...');
  
  const filesToDelete = [
    'all_companies_transformed.csv',
    'all_companies_cleaned.csv',
    'combined_cleaned.csv',
    'alabama_cleaned.csv',
    'combined_filtered_companies.csv',
    'combined_filtered_cleaned.csv'
  ];
  
  let deletedCount = 0;
  
  for (const file of filesToDelete) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`Deleted: ${file}`);
        deletedCount++;
      } catch (err) {
        console.error(`Error deleting ${file}:`, err.message);
      }
    }
  }
  
  console.log(`Deleted ${deletedCount} unnecessary files`);
}

/**
 * Main function
 */
async function main() {
  try {
    // Create the final filtered list
    const result = await createFinalFilteredList();
    
    if (result) {
      // Update database with filtered list
      await updateDatabaseWithFilteredList();
      
      // Cleanup unnecessary files
      cleanupFiles();
      
      console.log('\nAll done!');
      console.log(`Final filtered HVAC companies list: ${result.totalRecords} records`);
      console.log(`Ready for review fetching with ${result.placeIds.length} place_ids`);
    }
  } catch (err) {
    console.error('Error in main function:', err);
  }
}

// Run the script
main().catch(console.error);