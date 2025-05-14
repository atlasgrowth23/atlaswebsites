const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Create PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Configuration - adjust as needed
const CONFIG = {
  // Files to delete
  filesToDelete: [
    // Temporary or old CSV files
    'all_companies_transformed.csv',
    'all_companies_cleaned.csv',
    'companies_rows.csv',
    'companies_rows (1).csv',
    'companies_rows_original.csv',
    'filtered_companies.csv',
    'filtered_companies_cleaned.csv',
    'combined_filtered_companies.csv',
    'combined_filtered_cleaned.csv',
    'combined_cleaned.csv',
    'alabama_cleaned.csv',
    'arkansas_cleaned.csv',
    
    // Backup and temporary files
    '*.bak',
    '*.tmp',
    '*.old',
    
    // Other unnecessary files
    'prepare-deployment.sh',
    'Untitled spreadsheet - Outscraper-20250408050716s6d_hvac_contractor (3) (1).csv',
    'bamahvac - Copy of Copy of Outscraper-20250408050616m08_hvac_contractor.csv'
  ],
  
  // Directories to create
  directoriesToCreate: [
    'data',
    'data/raw',
    'data/processed',
    'data/reviews'
  ],
  
  // Files to keep
  filesToKeep: [
    'arkansas_filtered.csv',
    'companies_rows.csv',
    'combined_filtered_companies.csv'
  ],
  
  // Database tables to optimize by adding proper indexes
  tablesToOptimize: [
    'companies',
    'company_reviews',
    'company_review_stats'
  ],
  
  // Move files to appropriate directories
  fileMappings: [
    { pattern: '*filtered*.csv', destination: 'data/processed' },
    { pattern: '*outscraper*.csv', destination: 'data/raw' },
    { pattern: '*reviews*.csv', destination: 'data/reviews' }
  ]
};

/**
 * Delete unnecessary files
 */
function deleteUnnecessaryFiles() {
  console.log('Deleting unnecessary files...');
  
  let deletedCount = 0;
  
  for (const filePattern of CONFIG.filesToDelete) {
    const isGlob = filePattern.includes('*');
    
    if (isGlob) {
      // Handle pattern matching (simple implementation)
      const globPrefix = filePattern.split('*')[0];
      const globSuffix = filePattern.split('*')[1];
      
      const files = fs.readdirSync(process.cwd());
      for (const file of files) {
        if ((globPrefix === '' || file.startsWith(globPrefix)) && 
            (globSuffix === '' || file.endsWith(globSuffix))) {
          
          // Skip files in the keep list
          if (CONFIG.filesToKeep.includes(file)) {
            console.log(`Skipping file in keep list: ${file}`);
            continue;
          }
          
          // Delete the file
          try {
            fs.unlinkSync(path.join(process.cwd(), file));
            console.log(`Deleted: ${file}`);
            deletedCount++;
          } catch (err) {
            console.error(`Error deleting ${file}: ${err.message}`);
          }
        }
      }
    } else {
      // Skip files in the keep list
      if (CONFIG.filesToKeep.includes(filePattern)) {
        console.log(`Skipping file in keep list: ${filePattern}`);
        continue;
      }
      
      // Handle exact filename
      const filePath = path.join(process.cwd(), filePattern);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`Deleted: ${filePattern}`);
          deletedCount++;
        } catch (err) {
          console.error(`Error deleting ${filePattern}: ${err.message}`);
        }
      }
    }
  }
  
  console.log(`Deleted ${deletedCount} files`);
}

/**
 * Create necessary directories
 */
function createDirectories() {
  console.log('Creating directories...');
  
  for (const dir of CONFIG.directoriesToCreate) {
    const dirPath = path.join(process.cwd(), dir);
    
    if (!fs.existsSync(dirPath)) {
      try {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created directory: ${dir}`);
      } catch (err) {
        console.error(`Error creating directory ${dir}: ${err.message}`);
      }
    } else {
      console.log(`Directory already exists: ${dir}`);
    }
  }
}

/**
 * Move files to appropriate directories
 */
function moveFiles() {
  console.log('Moving files to appropriate directories...');
  
  let movedCount = 0;
  
  for (const mapping of CONFIG.fileMappings) {
    const pattern = mapping.pattern;
    const destination = path.join(process.cwd(), mapping.destination);
    
    // Ensure destination exists
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }
    
    const isGlob = pattern.includes('*');
    
    if (isGlob) {
      // Handle pattern matching
      const globPrefix = pattern.split('*')[0];
      const globSuffix = pattern.split('*')[1];
      
      const files = fs.readdirSync(process.cwd());
      for (const file of files) {
        if ((globPrefix === '' || file.startsWith(globPrefix)) && 
            (globSuffix === '' || file.endsWith(globSuffix))) {
          
          const sourcePath = path.join(process.cwd(), file);
          const destPath = path.join(destination, file);
          
          // Skip if source and destination are the same
          if (sourcePath === destPath) {
            continue;
          }
          
          try {
            // Copy instead of move to avoid breaking anything
            fs.copyFileSync(sourcePath, destPath);
            console.log(`Copied: ${file} -> ${mapping.destination}/${file}`);
            movedCount++;
          } catch (err) {
            console.error(`Error copying ${file}: ${err.message}`);
          }
        }
      }
    }
  }
  
  console.log(`Moved/copied ${movedCount} files`);
}

/**
 * Optimize database tables
 */
async function optimizeTables() {
  console.log('Optimizing database tables...');
  
  try {
    // Add missing indexes to companies table
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'companies' AND indexname = 'idx_companies_state') THEN
          CREATE INDEX idx_companies_state ON companies(state);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'companies' AND indexname = 'idx_companies_place_id') THEN
          CREATE INDEX idx_companies_place_id ON companies(place_id);
        END IF;
      END
      $$;
    `);
    console.log('Optimized companies table');
    
    // Add missing indexes to company_reviews table
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'company_reviews' AND indexname = 'idx_reviews_company_id') THEN
          CREATE INDEX idx_reviews_company_id ON company_reviews(company_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'company_reviews' AND indexname = 'idx_reviews_place_id') THEN
          CREATE INDEX idx_reviews_place_id ON company_reviews(place_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'company_reviews' AND indexname = 'idx_reviews_published_at') THEN
          CREATE INDEX idx_reviews_published_at ON company_reviews(published_at);
        END IF;
      END
      $$;
    `);
    console.log('Optimized company_reviews table');
    
    // Analyze all tables to update statistics
    await pool.query('ANALYZE');
    console.log('Updated database statistics');
    
  } catch (err) {
    console.error('Error optimizing database tables:', err);
  }
}

/**
 * Get database statistics
 */
async function getDatabaseStats() {
  console.log('Fetching database statistics...');
  
  try {
    // Table sizes
    const tableSizesResult = await pool.query(`
      SELECT
        table_name,
        pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as total_size,
        pg_size_pretty(pg_relation_size(quote_ident(table_name))) as table_size,
        pg_size_pretty(pg_total_relation_size(quote_ident(table_name)) - pg_relation_size(quote_ident(table_name))) as index_size
      FROM
        information_schema.tables
      WHERE
        table_schema = 'public'
      ORDER BY
        pg_total_relation_size(quote_ident(table_name)) DESC
      LIMIT 10
    `);
    
    console.log('\nTop 10 tables by size:');
    tableSizesResult.rows.forEach(row => {
      console.log(`${row.table_name}: ${row.total_size} (data: ${row.table_size}, indexes: ${row.index_size})`);
    });
    
    // Row counts
    const rowCountsResult = await pool.query(`
      SELECT
        'companies' as table_name,
        COUNT(*) as row_count
      FROM companies
      UNION ALL
      SELECT
        'company_reviews' as table_name,
        COUNT(*) as row_count
      FROM company_reviews
      UNION ALL
      SELECT
        'company_review_stats' as table_name,
        COUNT(*) as row_count
      FROM company_review_stats
    `);
    
    console.log('\nRow counts:');
    rowCountsResult.rows.forEach(row => {
      console.log(`${row.table_name}: ${row.row_count} rows`);
    });
    
    // Reviews statistics
    try {
      const reviewsStatsResult = await pool.query(`
        SELECT
          COUNT(DISTINCT place_id) as unique_businesses,
          COUNT(*) as total_reviews,
          ROUND(AVG(rating), 2) as avg_rating,
          MIN(published_at) as oldest_review,
          MAX(published_at) as newest_review
        FROM company_reviews
      `);
      
      if (reviewsStatsResult.rows.length > 0) {
        const stats = reviewsStatsResult.rows[0];
        console.log('\nReviews statistics:');
        console.log(`Businesses with reviews: ${stats.unique_businesses}`);
        console.log(`Total reviews: ${stats.total_reviews}`);
        console.log(`Average rating: ${stats.avg_rating}`);
        console.log(`Date range: ${stats.oldest_review ? stats.oldest_review.toISOString().split('T')[0] : 'N/A'} to ${stats.newest_review ? stats.newest_review.toISOString().split('T')[0] : 'N/A'}`);
      }
    } catch (err) {
      console.log('Review statistics not available');
    }
    
  } catch (err) {
    console.error('Error fetching database statistics:', err);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Starting project cleanup...');
  
  // Create directories first
  createDirectories();
  
  // Move files to appropriate directories
  moveFiles();
  
  // Delete unnecessary files
  deleteUnnecessaryFiles();
  
  // Optimize database tables
  await optimizeTables();
  
  // Get database statistics
  await getDatabaseStats();
  
  // Close database connection
  await pool.end();
  
  console.log('\nCleanup complete!');
}

// Run the script
main().catch(err => {
  console.error('Error in main function:', err);
  process.exit(1);
});