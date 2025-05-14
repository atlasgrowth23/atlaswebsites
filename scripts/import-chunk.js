const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// CSV file path
const CSV_FILE = path.join(process.cwd(), 'combined_filtered_hvac.csv');

// Create PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Get the starting line from command arguments
const startLine = parseInt(process.argv[2] || 1, 10);
const endLine = parseInt(process.argv[3] || 10000, 10);

async function importCompaniesChunk(startLine, endLine) {
  console.log(`Importing companies from lines ${startLine} to ${endLine}...`);
  
  // Read CSV file content
  const csvContent = fs.readFileSync(CSV_FILE, 'utf8');
  
  // Get all lines
  const lines = csvContent.trim().split('\n');
  const headerLine = lines[0];
  const totalLines = lines.length;
  
  if (startLine >= totalLines) {
    console.log('Start line exceeds total lines in file');
    return 0;
  }
  
  const actualEndLine = Math.min(endLine, totalLines);
  
  console.log(`File has ${totalLines} total lines (including header)`);
  console.log(`Processing lines ${startLine} to ${actualEndLine}`);
  
  // Process each line in the specified range
  let inserted = 0;
  let errors = 0;
  
  for (let i = startLine; i < actualEndLine; i++) {
    try {
      // Simple split by comma - not perfect for all cases
      const values = lines[i].split(',');
      
      // Skip header row 
      if (i === 0) {
        continue;
      }
      
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
      
      if (inserted % 10 === 0) {
        console.log(`Processed ${i} of ${actualEndLine-1}, inserted ${inserted} companies...`);
      }
    } catch (err) {
      console.error(`Error on line ${i}:`, err.message);
      errors++;
    }
  }
  
  console.log(`\nChunk import completed: ${inserted} companies inserted, ${errors} errors`);
  return inserted;
}

async function main() {
  try {
    console.log(`Starting chunk import (${startLine}-${endLine})...`);
    
    const inserted = await importCompaniesChunk(startLine, endLine);
    
    // Check results
    const countResult = await pool.query('SELECT COUNT(*) FROM companies');
    console.log(`Total companies in database: ${countResult.rows[0].count}`);
    
    // Get state distribution (if we have enough data)
    if (countResult.rows[0].count > 0) {
      const stateResult = await pool.query(`
        SELECT state, COUNT(*) as company_count
        FROM companies
        WHERE state IS NOT NULL AND state != ''
        GROUP BY state
        ORDER BY company_count DESC
        LIMIT 5
      `);
      
      console.log('\nCompanies by state (top 5):');
      stateResult.rows.forEach(row => {
        console.log(`${row.state}: ${row.company_count}`);
      });
    }
    
  } catch (err) {
    console.error('Error in main function:', err);
  } finally {
    await pool.end();
    console.log('Database connection closed');
  }
}

main().catch(console.error);