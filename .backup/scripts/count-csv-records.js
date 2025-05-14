const fs = require('fs');
const path = require('path');

/**
 * Count records in a CSV file
 */
async function countCsvRecords() {
  console.log('Counting records in CSV files...');
  
  // File paths
  const alabamaFilteredPath = path.join(process.cwd(), 'filtered_companies.csv');
  const arkansasFilteredPath = path.join(process.cwd(), 'arkansas_filtered.csv');
  
  // Alabama stats
  if (fs.existsSync(alabamaFilteredPath)) {
    const alabamaContent = fs.readFileSync(alabamaFilteredPath, 'utf8');
    const alabamaLines = alabamaContent.split('\n').filter(line => line.trim().length > 0);
    const alabamaHeader = alabamaLines[0];
    const alabamaHeaderColumns = alabamaHeader.split(',').length;
    const alabamaRecordCount = alabamaLines.length - 1; // Subtract header
    
    console.log('\nAlabama CSV Statistics:');
    console.log(`File: ${alabamaFilteredPath}`);
    console.log(`Header columns: ${alabamaHeaderColumns}`);
    console.log(`Record count (including problematic): ${alabamaRecordCount}`);
    
    // Count states represented
    const stateColumnIndex = 12; // Based on the schema (state is the 13th column, 0-indexed)
    const alabamaStates = {};
    
    for (let i = 1; i < alabamaLines.length; i++) {
      try {
        const line = alabamaLines[i];
        const columns = line.split(',');
        const state = columns[stateColumnIndex]?.replace(/"/g, '') || 'Unknown';
        alabamaStates[state] = (alabamaStates[state] || 0) + 1;
      } catch (err) {
        // Skip problematic lines
      }
    }
    
    console.log('\nStates represented in Alabama CSV:');
    Object.entries(alabamaStates)
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .forEach(([state, count]) => {
        console.log(`${state}: ${count}`);
      });
  } else {
    console.log(`Alabama CSV file not found at ${alabamaFilteredPath}`);
  }
  
  // Arkansas stats
  if (fs.existsSync(arkansasFilteredPath)) {
    const arkansasContent = fs.readFileSync(arkansasFilteredPath, 'utf8');
    const arkansasLines = arkansasContent.split('\n').filter(line => line.trim().length > 0);
    const arkansasHeader = arkansasLines[0];
    const arkansasHeaderColumns = arkansasHeader.split(',').length;
    const arkansasRecordCount = arkansasLines.length - 1; // Subtract header
    
    console.log('\nArkansas CSV Statistics:');
    console.log(`File: ${arkansasFilteredPath}`);
    console.log(`Header columns: ${arkansasHeaderColumns}`);
    console.log(`Record count (including problematic): ${arkansasRecordCount}`);
    
    // Count states represented
    const stateColumnIndex = 12; // Based on the schema (state is the 13th column, 0-indexed)
    const arkansasStates = {};
    
    for (let i = 1; i < arkansasLines.length; i++) {
      try {
        const line = arkansasLines[i];
        const columns = line.split(',');
        const state = columns[stateColumnIndex]?.replace(/"/g, '') || 'Unknown';
        arkansasStates[state] = (arkansasStates[state] || 0) + 1;
      } catch (err) {
        // Skip problematic lines
      }
    }
    
    console.log('\nStates represented in Arkansas CSV:');
    Object.entries(arkansasStates)
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .forEach(([state, count]) => {
        console.log(`${state}: ${count}`);
      });
  } else {
    console.log(`Arkansas CSV file not found at ${arkansasFilteredPath}`);
  }
  
  // Combined total estimate
  if (fs.existsSync(alabamaFilteredPath) && fs.existsSync(arkansasFilteredPath)) {
    const alabamaContent = fs.readFileSync(alabamaFilteredPath, 'utf8');
    const arkansasContent = fs.readFileSync(arkansasFilteredPath, 'utf8');
    
    const alabamaLines = alabamaContent.split('\n').filter(line => line.trim().length > 0);
    const arkansasLines = arkansasContent.split('\n').filter(line => line.trim().length > 0);
    
    const alabamaRecordCount = alabamaLines.length - 1; // Subtract header
    const arkansasRecordCount = arkansasLines.length - 1; // Subtract header
    
    console.log('\nCombined Statistics:');
    console.log(`Alabama records: ${alabamaRecordCount}`);
    console.log(`Arkansas records: ${arkansasRecordCount}`);
    console.log(`Total records: ${alabamaRecordCount + arkansasRecordCount}`);
  }
}

// Run the count
countCsvRecords().catch(err => {
  console.error('Error during processing:', err);
});