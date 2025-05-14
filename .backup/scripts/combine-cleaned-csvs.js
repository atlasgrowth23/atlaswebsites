const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

/**
 * Clean a CSV file and return the parsed records
 * @param {string} filePath - Path to the CSV file
 * @param {string} outputPath - Path to save the cleaned CSV
 * @returns {Array} Parsed records
 */
async function cleanAndParseCsv(filePath, outputPath) {
  console.log(`Cleaning CSV file: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`CSV file not found at ${filePath}`);
    return [];
  }
  
  // Read the file content
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const lines = fileContent.split('\n');
  const header = lines[0];
  const headerColumns = header.split(',');
  console.log(`Header has ${headerColumns.length} columns`);
  
  // Clean and validate lines
  const cleanedLines = [header];
  let problemLines = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    // Count commas outside quoted fields
    let inQuotes = false;
    let commaCount = 0;
    
    for (let j = 0; j < line.length; j++) {
      if (line[j] === '"' && (j === 0 || line[j-1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (line[j] === ',' && !inQuotes) {
        commaCount++;
      }
    }
    
    // Header should have N-1 commas for N columns
    const expectedCommas = headerColumns.length - 1;
    
    if (commaCount === expectedCommas) {
      cleanedLines.push(line);
    } else {
      console.log(`Line ${i+1} has incorrect comma count: ${commaCount} (expected ${expectedCommas})`);
      problemLines++;
      // Skip this problematic line
    }
  }
  
  // Write the cleaned file
  fs.writeFileSync(outputPath, cleanedLines.join('\n'));
  
  console.log(`Cleanup complete!`);
  console.log(`Processed ${lines.length} lines`);
  console.log(`Found and skipped ${problemLines} problematic lines`);
  console.log(`Cleaned CSV written to: ${outputPath}`);
  
  // Parse the cleaned CSV
  const cleanedContent = fs.readFileSync(outputPath, 'utf8');
  try {
    const records = parse(cleanedContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    console.log(`Successfully parsed ${records.length} records`);
    return records;
  } catch (err) {
    console.error('Error parsing cleaned CSV:', err);
    return [];
  }
}

/**
 * Combine Alabama and Arkansas cleaned CSVs
 */
async function combineCsvs() {
  console.log('Starting CSV combination process...');
  
  // Clean each CSV file first
  const alabamaPath = path.join(process.cwd(), 'filtered_companies.csv');
  const arkansasPath = path.join(process.cwd(), 'arkansas_filtered.csv');
  
  const alabamaCleanedPath = path.join(process.cwd(), 'alabama_cleaned.csv');
  const arkansasCleanedPath = path.join(process.cwd(), 'arkansas_cleaned.csv');
  
  console.log('\nCleaning Alabama CSV file...');
  const alabamaRecords = await cleanAndParseCsv(alabamaPath, alabamaCleanedPath);
  
  console.log('\nCleaning Arkansas CSV file...');
  const arkansasRecords = await cleanAndParseCsv(arkansasPath, arkansasCleanedPath);
  
  // Combine the records
  console.log('\nCombining cleaned records...');
  const combinedRecords = [...alabamaRecords, ...arkansasRecords];
  console.log(`Combined total: ${combinedRecords.length} companies`);
  
  // Read schema headers from one of the cleaned files
  const schemaContent = fs.readFileSync(alabamaCleanedPath, 'utf8');
  const schemaHeader = schemaContent.split('\n')[0];
  const targetColumns = schemaHeader.split(',');
  
  // Write the combined records to a new CSV file
  const combinedPath = path.join(process.cwd(), 'combined_cleaned.csv');
  const combinedCsvOutput = stringify(combinedRecords, { 
    header: true,
    columns: targetColumns 
  });
  
  fs.writeFileSync(combinedPath, combinedCsvOutput);
  console.log(`Combined CSV written to: ${combinedPath}`);
  
  // Summary
  console.log('\nSummary:');
  console.log(`Alabama companies: ${alabamaRecords.length}`);
  console.log(`Arkansas companies: ${arkansasRecords.length}`);
  console.log(`Total combined: ${combinedRecords.length}`);
  
  // Additional stats
  const stateStats = {};
  for (const record of combinedRecords) {
    const state = record.state || 'Unknown';
    stateStats[state] = (stateStats[state] || 0) + 1;
  }
  
  console.log('\nCompanies by state:');
  for (const [state, count] of Object.entries(stateStats)) {
    console.log(`${state}: ${count}`);
  }
}

// Run the combination
combineCsvs().catch(err => {
  console.error('Error during processing:', err);
});