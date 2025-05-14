const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Function to clean the CSV file
async function fixCsvFormat() {
  const inputPath = path.join(process.cwd(), 'combined_filtered_hvac.csv');
  const outputPath = path.join(process.cwd(), 'fixed_hvac.csv');
  
  console.log('Starting CSV fix process...');
  
  try {
    // Create read stream for line-by-line processing
    const fileStream = fs.createReadStream(inputPath, {encoding: 'utf8'});
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    // Create write stream for output
    const writeStream = fs.createWriteStream(outputPath);
    
    let isFirstLine = true;
    let lineCount = 0;
    
    // Process each line
    for await (const line of rl) {
      lineCount++;
      
      // Output header as-is
      if (isFirstLine) {
        writeStream.write(line + '\n');
        isFirstLine = false;
        continue;
      }
      
      // Process data lines: ensure all quotes are properly escaped and fields containing commas are quoted
      const processedLine = processDataLine(line);
      writeStream.write(processedLine + '\n');
      
      // Log progress
      if (lineCount % 100 === 0) {
        console.log(`Processed ${lineCount} lines...`);
      }
    }
    
    // Close the write stream
    writeStream.end();
    
    console.log(`\nCSV fix completed!`);
    console.log(`Processed ${lineCount} lines`);
    console.log(`Fixed CSV written to: ${outputPath}`);
    
    return outputPath;
    
  } catch (error) {
    console.error(`Error fixing CSV: ${error.message}`);
    throw error;
  }
}

// Function to process a data line and fix common CSV issues
function processDataLine(line) {
  const columns = [];
  let currentColumn = '';
  let inQuotes = false;
  
  // Manually parse the line, character by character
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = i < line.length - 1 ? line[i + 1] : null;
    
    if (char === '"') {
      // Handle quote characters
      if (inQuotes) {
        // Check if this is an escaped quote
        if (nextChar === '"') {
          currentColumn += '"';
          i++; // Skip the next quote
        } else {
          // End of quoted field
          inQuotes = false;
        }
      } else {
        // Start of quoted field
        inQuotes = true;
      }
    } else if (char === ',' && !inQuotes) {
      // End of column (outside quotes)
      columns.push(currentColumn);
      currentColumn = '';
    } else {
      // Regular character, add to current column
      currentColumn += char;
    }
  }
  
  // Add the last column
  columns.push(currentColumn);
  
  // Now properly format each column
  const formattedColumns = columns.map(column => {
    // Escape any quotes in the column
    const escaped = column.replace(/"/g, '""');
    
    // Quote the column if it contains commas, quotes, or newlines
    if (escaped.includes(',') || escaped.includes('"') || 
        escaped.includes('\n') || escaped.includes('\r')) {
      return `"${escaped}"`;
    }
    
    return escaped;
  });
  
  // Join the columns back into a line
  return formattedColumns.join(',');
}

// Main function to run the script
async function main() {
  try {
    const fixedCsvPath = await fixCsvFormat();
    
    // Create a SQL script to import the fixed CSV
    const sqlFilePath = path.join(process.cwd(), 'import_fixed.sql');
    
    const sqlContent = `
-- Clear the table
TRUNCATE TABLE companies RESTART IDENTITY CASCADE;

-- Import from fixed CSV
\\copy companies (id,slug,subdomain,custom_domain,name,site,phone,phone_carrier_type,category,street,city,postal_code,state,latitude,longitude,rating,reviews,photos_count,working_hours,about,logo,verified,place_id,location_link,location_reviews_link,email_1,email_1_validator_status,email_1_full_name,facebook,instagram,extras,created_at,updated_at) FROM './fixed_hvac.csv' WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '"');

-- Count the imported records
SELECT COUNT(*) AS imported_records FROM companies;
`;
    
    fs.writeFileSync(sqlFilePath, sqlContent);
    
    // Create a shell script to run the SQL
    const shellScriptPath = path.join(process.cwd(), 'run_fixed_import.sh');
    
    const shellContent = `#!/bin/bash
# Execute the SQL import command
export PGPASSWORD="${process.env.DATABASE_URL.split(':')[2].split('@')[0]}"
DBURL="${process.env.DATABASE_URL}"
echo "Running PSQL import with fixed CSV..."
psql "$DBURL" -f import_fixed.sql
`;
    
    fs.writeFileSync(shellScriptPath, shellContent);
    fs.chmodSync(shellScriptPath, 0o755); // Make it executable
    
    console.log(`\nCreated SQL import file at: ${sqlFilePath}`);
    console.log(`Created shell script at: ${shellScriptPath}`);
    console.log(`
To import the fixed CSV data, run:
  bash ${shellScriptPath}
`);
    
  } catch (error) {
    console.error(`Error in main function: ${error.message}`);
  }
}

// Run the main function
main().catch(err => {
  console.error(`Unhandled error: ${err.message}`);
  process.exit(1);
});