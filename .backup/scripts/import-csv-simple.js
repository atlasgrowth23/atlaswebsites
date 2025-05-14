const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// CSV file path
const CSV_FILE = path.join(process.cwd(), 'combined_filtered_hvac.csv');

// Create PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function importCompanies() {
  console.log(`Importing companies from ${CSV_FILE}...`);
  
  // Read CSV file content
  const csvContent = fs.readFileSync(CSV_FILE, 'utf8');
  
  // Get all lines and fields
  const lines = csvContent.trim().split('\n');
  const headerLine = lines[0];
  const headers = headerLine.split(',');
  
  console.log(`CSV has ${headers.length} columns and ${lines.length-1} data rows`);
  
  // Process each line
  let inserted = 0;
  let errors = 0;
  
  for (let i = 1; i < lines.length; i++) {
    try {
      // Simple split by comma - not perfect for all cases
      const values = lines[i].split(',');
      
      // Basic check to skip problematic lines
      if (values.length < 10) {
        console.log(`Skipping line ${i}: insufficient fields (${values.length})`);
        continue;
      }
      
      // Only use these specific fields to reduce errors
      const id = values[0]?.trim() || '';
      const name = values[4]?.trim() || '';
      const phone = values[6]?.trim() || '';
      const category = values[8]?.trim() || '';
      const city = values[10]?.trim() || '';
      const state = values[12]?.trim() || '';
      const place_id = values[22]?.trim() || '';
      
      // Skip if no essential data
      if (!id || !name) {
        console.log(`Skipping line ${i}: missing ID or name`);
        continue;
      }
      
      // Simple insert with minimal fields
      await pool.query(`
        INSERT INTO companies (id, name, phone, category, city, state, place_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          phone = EXCLUDED.phone, 
          category = EXCLUDED.category,
          city = EXCLUDED.city,
          state = EXCLUDED.state,
          place_id = EXCLUDED.place_id
      `, [id, name, phone, category, city, state, place_id]);
      
      inserted++;
      
      if (inserted % 50 === 0) {
        console.log(`Processed ${i} of ${lines.length-1} lines, inserted ${inserted} companies...`);
      }
    } catch (err) {
      console.error(`Error on line ${i}:`, err.message);
      errors++;
    }
  }
  
  console.log(`\nImport completed: ${inserted} companies imported, ${errors} errors`);
}

async function main() {
  try {
    console.log('Starting simple CSV import...');
    
    await importCompanies();
    
    // Check results
    const countResult = await pool.query('SELECT COUNT(*) FROM companies');
    console.log(`Total companies in database: ${countResult.rows[0].count}`);
    
    // Get state distribution
    const stateResult = await pool.query(`
      SELECT state, COUNT(*) as company_count
      FROM companies
      WHERE state IS NOT NULL AND state != ''
      GROUP BY state
      ORDER BY company_count DESC
      LIMIT 10
    `);
    
    console.log('\nCompanies by state (top 10):');
    stateResult.rows.forEach(row => {
      console.log(`${row.state}: ${row.company_count}`);
    });
    
  } catch (err) {
    console.error('Error in main function:', err);
  } finally {
    await pool.end();
    console.log('Database connection closed');
  }
}

main().catch(console.error);