import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { query } from '../lib/db-simple';

async function main() {
  try {
    console.log('Starting import from CSV to Replit PostgreSQL...');
    
    // First, check if the Replit database is properly connected
    console.log('\nChecking Replit database connection...');
    const dbInfo = await query('SELECT current_database() as db_name, version()');
    console.log('Connected to database:', dbInfo.rows[0].db_name);
    console.log('PostgreSQL version:', dbInfo.rows[0].version);
    
    // Read the CSV file
    console.log('\nReading companies CSV file...');
    const csvPath = path.join(process.cwd(), 'companies_rows (1).csv');
    
    if (!fs.existsSync(csvPath)) {
      console.error(`CSV file not found at ${csvPath}`);
      return;
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    
    // Parse CSV data
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    console.log(`Found ${records.length} companies in CSV file`);
    
    if (records.length === 0) {
      console.log('No data found in CSV file');
      return;
    }
    
    // Get column names from the first record
    const columns = Object.keys(records[0]);
    console.log(`Found ${columns.length} columns: ${columns.join(', ')}`);
    
    // Create the companies table
    console.log('\nCreating companies table if it doesn\'t exist...');
    
    // Determine column types
    const columnTypes = {};
    for (const col of columns) {
      // Default type is TEXT
      columnTypes[col] = 'TEXT';
      
      // Look for a non-null value in the records
      for (const record of records) {
        const value = record[col];
        if (value !== null && value !== undefined && value !== '') {
          if (!isNaN(Number(value))) {
            // Check if it's an integer or decimal
            columnTypes[col] = value.includes('.') ? 'NUMERIC' : 'INTEGER';
          } else if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
            columnTypes[col] = 'BOOLEAN';
          }
          break;
        }
      }
    }
    
    // Build column definitions for CREATE TABLE
    const columnsDef = columns.map(col => `"${col}" ${columnTypes[col]}`).join(', ');
    
    // Create the table
    await query(`
      CREATE TABLE IF NOT EXISTS companies (
        ${columnsDef}
      )
    `);
    console.log('Companies table created or already exists');
    
    // Insert data
    console.log('\nInserting companies data...');
    let insertedCount = 0;
    
    // For each company in the CSV
    for (const record of records) {
      try {
        // Clean up the data - convert empty strings to null
        for (const key in record) {
          if (record[key] === '') {
            record[key] = null;
          }
        }
        
        const columns = Object.keys(record);
        const columnString = columns.map(col => `"${col}"`).join(', ');
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const values = Object.values(record);
        
        // Log a preview of the company
        console.log(`Inserting company: ${record.name || 'Unknown'} (${record.slug || 'no-slug'})`);
        
        // Insert the company
        await query(`
          INSERT INTO companies (${columnString})
          VALUES (${placeholders})
          ON CONFLICT DO NOTHING
        `, values);
        
        insertedCount++;
      } catch (insertErr: any) {
        console.error(`Error inserting company:`, insertErr.message);
      }
    }
    
    console.log(`\nSuccessfully inserted ${insertedCount} of ${records.length} companies`);
    
    // Verify the insert
    const countResult = await query('SELECT COUNT(*) as count FROM companies');
    console.log(`Companies table now contains ${countResult.rows[0].count} rows`);
    
    console.log('\nCreating user_profiles table for authentication...');
    await query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id SERIAL PRIMARY KEY,
        user_id UUID,
        role TEXT NOT NULL,
        business_slug TEXT,
        email TEXT UNIQUE,
        default_password TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('User profiles table created');
    
    console.log('\nImport completed successfully!');
    
  } catch (err: any) {
    console.error('Import failed:', err.message);
  } finally {
    process.exit(0);
  }
}

// Run the import
main();