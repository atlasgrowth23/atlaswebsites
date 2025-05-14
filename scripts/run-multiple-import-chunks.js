const { execSync } = require('child_process');

/**
 * Run the mini-chunk import script multiple times
 */
async function runMultipleImportChunks() {
  try {
    const NUM_ITERATIONS = 10; // Adjust this number as needed
    
    console.log(`Running mini-chunk import script ${NUM_ITERATIONS} times...`);
    
    for (let i = 0; i < NUM_ITERATIONS; i++) {
      console.log(`\n=== Running iteration ${i + 1} of ${NUM_ITERATIONS} ===\n`);
      
      // Run the mini-chunk import script
      execSync('node scripts/import-google-reviews-mini-chunk.js', { stdio: 'inherit' });
      
      console.log(`\n=== Completed iteration ${i + 1} of ${NUM_ITERATIONS} ===\n`);
      
      // Small delay between runs
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\nAll ${NUM_ITERATIONS} iterations completed successfully.`);
    
    // Show the current import status
    execSync('node scripts/check-reviews-import.js', { stdio: 'inherit' });
    
  } catch (error) {
    console.error('Error running import chunks:', error.message);
    process.exit(1);
  }
}

// Run the function
runMultipleImportChunks().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});