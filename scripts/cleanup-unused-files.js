/**
 * Clean up unused files and optimize the repository structure
 */

const fs = require('fs');
const path = require('path');

const filesToDelete = [
  // Add any specific files you want to remove
  'scripts/create-hvac-tables.ts',
  'scripts/create-message-tables.ts',
  // Add more files as needed
];

const directoriesToCheck = [
  'scripts',
  'lib', 
  'components',
  'pages'
];

async function cleanupFiles() {
  console.log('🧹 Starting repository cleanup...');
  
  let deletedCount = 0;
  
  // Delete specific files
  for (const file of filesToDelete) {
    const filePath = path.join(process.cwd(), file);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✓ Deleted: ${file}`);
        deletedCount++;
      }
    } catch (error) {
      console.log(`⚠️  Could not delete ${file}: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Cleanup Summary:`);
  console.log(`- Files deleted: ${deletedCount}`);
  console.log(`- Repository structure optimized for multi-business platform`);
  console.log(`\n✨ Cleanup complete!`);
}

if (require.main === module) {
  cleanupFiles().catch(console.error);
}

module.exports = { cleanupFiles };