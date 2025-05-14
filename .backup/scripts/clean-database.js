const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Create PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Execute a query with error handling
 */
async function query(text, params = []) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (err) {
    console.error(`Error executing query: ${text}`);
    console.error(err.message);
    return null;
  }
}

/**
 * Get all tables in the public schema
 */
async function getAllTables() {
  const result = await query(`
    SELECT table_name 
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);
  
  return result.rows.map(row => row.table_name);
}

/**
 * Drop backup tables
 */
async function dropBackupTables() {
  console.log('\nDropping backup tables...');
  
  const backupTables = [
    'backup_chat_messages',
    'backup_companies',
    'backup_hvac_contacts',
    'backup_messages'
  ];
  
  for (const table of backupTables) {
    console.log(`Dropping table: ${table}`);
    await query(`DROP TABLE IF EXISTS ${table} CASCADE`);
  }
  
  console.log('All backup tables dropped');
}

/**
 * Drop specific tables
 */
async function dropSpecificTables() {
  console.log('\nDropping specific tables...');
  
  const tablesToDrop = [
    'filtered_companies',
    'company_reviews',
    'company_review_stats',
    'company_frames',
    'hvac_test'
  ];
  
  for (const table of tablesToDrop) {
    console.log(`Dropping table: ${table}`);
    await query(`DROP TABLE IF EXISTS ${table} CASCADE`);
  }
  
  console.log('All specified tables dropped');
}

/**
 * Clean all tables (delete all data)
 */
async function cleanAllTables() {
  console.log('\nCleaning all remaining tables...');
  
  const tables = await getAllTables();
  
  // Tables to clean (delete all data from)
  // We exclude system tables or tables that shouldn't be emptied
  const tablesToClean = tables.filter(table => 
    !table.startsWith('backup_') &&
    !table.startsWith('pg_') &&
    table !== 'template_frames' &&
    table !== 'frames'
  );
  
  for (const table of tablesToClean) {
    console.log(`Truncating table: ${table}`);
    await query(`TRUNCATE TABLE ${table} CASCADE`);
  }
  
  console.log('All tables cleaned');
}

/**
 * Count records in tables
 */
async function countRecords() {
  console.log('\nCounting records in tables:');
  
  const tables = await getAllTables();
  
  for (const table of tables) {
    const result = await query(`SELECT COUNT(*) FROM ${table}`);
    if (result) {
      console.log(`${table}: ${result.rows[0].count} records`);
    }
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting database cleanup...');
    
    // Count records before cleanup
    console.log('\nBEFORE CLEANUP:');
    await countRecords();
    
    // Drop backup tables
    await dropBackupTables();
    
    // Drop specific tables
    await dropSpecificTables();
    
    // Clean all tables (delete all data)
    await cleanAllTables();
    
    // Verify cleanup
    console.log('\nAFTER CLEANUP:');
    await countRecords();
    
    console.log('\nDatabase cleanup completed successfully');
    
  } catch (err) {
    console.error('Error in main function:', err);
  } finally {
    await pool.end();
    console.log('Database connection closed');
  }
}

// Run the script
main().catch(console.error);