const fs = require('fs');
const path = require('path');

/**
 * Script to clean issues in the CSV file that might cause parsing problems
 */
async function cleanCsvFile() {
  try {
    console.log('Starting CSV file cleanup...');
    
    // File paths
    const inputPath = path.join(process.cwd(), 'filtered_companies.csv');
    const outputPath = path.join(process.cwd(), 'filtered_companies_cleaned.csv');
    
    if (!fs.existsSync(inputPath)) {
      console.error(`Input CSV file not found at ${inputPath}`);
      return;
    }
    
    // Read the input file
    console.log(`Reading CSV file: ${inputPath}`);
    const content = fs.readFileSync(inputPath, 'utf8');
    
    // Split into lines and get header
    const lines = content.split('\n');
    const header = lines[0];
    console.log(`Header has ${header.split(',').length} columns`);
    
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
      const expectedCommas = header.split(',').length - 1;
      
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
    
  } catch (err) {
    console.error('Error during CSV cleanup:', err);
  }
}

// Run the cleanup
cleanCsvFile().catch(err => {
  console.error('Unhandled error:', err);
});