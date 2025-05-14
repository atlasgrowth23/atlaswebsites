const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// File paths
const ALABAMA_FILE = path.join(process.cwd(), 'filtered_companies_cleaned.csv');
const ARKANSAS_FILE = path.join(process.cwd(), 'arkansas_filtered.csv');
const OUTPUT_FILE = path.join(process.cwd(), 'combined_filtered_hvac.csv');

/**
 * Simple utility to combine two CSV files, preserving the header from the first one
 */
function combineFiles() {
  // Check if files exist
  if (!fs.existsSync(ALABAMA_FILE)) {
    console.error(`Alabama file not found: ${ALABAMA_FILE}`);
    return;
  }
  
  if (!fs.existsSync(ARKANSAS_FILE)) {
    console.error(`Arkansas file not found: ${ARKANSAS_FILE}`);
    return;
  }
  
  // Count records in each file
  console.log('Counting records in files...');
  
  const alabamaData = fs.readFileSync(ALABAMA_FILE, 'utf8');
  const alabamaLines = alabamaData.split('\n').filter(line => line.trim()).length - 1; // Subtract header
  
  const arkansasData = fs.readFileSync(ARKANSAS_FILE, 'utf8');
  const arkansasLines = arkansasData.split('\n').filter(line => line.trim()).length - 1; // Subtract header
  
  console.log(`Alabama file has ${alabamaLines} records`);
  console.log(`Arkansas file has ${arkansasLines} records`);
  console.log(`Total expected records: ${alabamaLines + arkansasLines}`);
  
  // Get the header from the Alabama file
  const header = alabamaData.split('\n')[0];
  
  // Get all data rows from both files (skip headers)
  const alabamaRows = alabamaData.split('\n').slice(1).filter(line => line.trim());
  const arkansasRows = arkansasData.split('\n').slice(1).filter(line => line.trim());
  
  // Combine all rows with the header
  const combinedContent = [header, ...alabamaRows, ...arkansasRows].join('\n');
  
  // Write the combined file
  fs.writeFileSync(OUTPUT_FILE, combinedContent);
  
  // Count lines in the output file
  const outputData = fs.readFileSync(OUTPUT_FILE, 'utf8');
  const outputLines = outputData.split('\n').filter(line => line.trim()).length - 1; // Subtract header
  
  console.log(`Combined file written with ${outputLines} records (${outputLines === alabamaLines + arkansasLines ? 'correct' : 'incorrect'})`);
  
  // Also, let's use the bash command to be sure
  exec(`wc -l ${OUTPUT_FILE}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing wc: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`wc stderr: ${stderr}`);
      return;
    }
    console.log(`wc output: ${stdout.trim()}`);
  });
}

// Run the function
combineFiles();