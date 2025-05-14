const fs = require('fs');
const path = require('path');

/**
 * Organize files by moving CSVs to appropriate folders
 */
function organizeFiles() {
  console.log('Starting file organization...');
  
  // Create directories if they don't exist
  const rawDataDir = path.join(process.cwd(), 'data', 'raw');
  const processedDataDir = path.join(process.cwd(), 'data', 'processed');
  const reviewsDir = path.join(process.cwd(), 'data', 'reviews');
  
  [rawDataDir, processedDataDir, reviewsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
  
  // Find all CSV files in the root directory
  const files = fs.readdirSync(process.cwd());
  const csvFiles = files.filter(file => file.endsWith('.csv'));
  
  console.log(`Found ${csvFiles.length} CSV files in root directory`);
  
  // Categorize files based on naming patterns
  const rawFiles = csvFiles.filter(file => {
    return file.includes('Outscraper') || file.includes('spreadsheet') || file === 'companies_rows.csv' || file === 'companies_rows_original.csv';
  });
  
  const processedFiles = csvFiles.filter(file => {
    return file.includes('filtered') || file.includes('cleaned') || file.includes('transformed') || file.includes('combined') || file.includes('arkansas') || file.includes('alabama');
  });
  
  const reviewFiles = csvFiles.filter(file => {
    return file.includes('review') || file.includes('_reviews');
  });
  
  // Move files to appropriate directories
  function moveFiles(fileList, targetDir, category) {
    console.log(`\nMoving ${fileList.length} ${category} files to ${targetDir}...`);
    
    fileList.forEach(file => {
      const sourcePath = path.join(process.cwd(), file);
      const targetPath = path.join(targetDir, file);
      
      try {
        // Copy the file rather than move to ensure we don't break anything
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`Copied: ${file}`);
      } catch (err) {
        console.error(`Error copying ${file}:`, err.message);
      }
    });
  }
  
  // Move files to their respective directories
  moveFiles(rawFiles, rawDataDir, 'raw data');
  moveFiles(processedFiles, processedDataDir, 'processed data');
  moveFiles(reviewFiles, reviewsDir, 'review data');
  
  console.log('\nFile organization complete!');
  console.log('Note: Original files still remain in root directory. You can delete them manually if needed.');
}

// Run the function
organizeFiles();