import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { neon } from '@neondatabase/serverless';

// Replit PostgreSQL connection
const sql = neon(process.env.DATABASE_URL!);

async function main() {
  try {
    console.log('Starting import from CSV to Replit PostgreSQL...');
    
    // First, check if the Replit database is properly connected
    console.log('\nChecking Replit database connection...');
    const dbInfo = await sql.query('SELECT current_database() as db_name, version()');
    console.log('Connected to database:', dbInfo.rows[0].db_name);
    console.log('PostgreSQL version:', dbInfo.rows[0].version);
    
    // Read the CSV file
    console.log('\nReading companies CSV file...');
    const csvPath = path.join(process.cwd(), 'companies_rows (1).csv');
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
    
    // Build column definitions for CREATE TABLE
    const columnsDef = columns.map(col => {
      // Infer data type based on the first non-null value
      let dataType = 'TEXT';
      
      // Look for a non-null value in the records
      for (const record of records) {
        const value = record[col];
        if (value !== null && value !== undefined && value !== '') {
          if (!isNaN(Number(value))) {
            // Check if it's an integer or decimal
            dataType = value.includes('.') ? 'NUMERIC' : 'INTEGER';
          } else if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
            dataType = 'BOOLEAN';
          }
          break;
        }
      }
      
      return `"${col}" ${dataType}`;
    }).join(', ');
    
    // Execute CREATE TABLE statement directly
    const createTableQuery = `CREATE TABLE IF NOT EXISTS "companies" (${columnsDef})`;
    await sql.query(createTableQuery);
    console.log('Companies table created or already exists');
    
    // Insert data
    console.log('\nInserting companies data...');
    let insertedCount = 0;
    
    for (const record of records) {
      try {
        // Clean up the data - convert empty strings to null
        for (const key in record) {
          if (record[key] === '') {
            record[key] = null;
          }
        }
        
        // For Neon serverless, we need to handle inserts differently
        // We'll construct a complete SQL query string with values and execute it directly
        
        const columns = Object.keys(record);
        const values = Object.values(record);
        const columnString = columns.map(col => `"${col}"`).join(', ');
        
        // Create a values string with proper SQL escaping for each value type
        const valueString = values.map(val => {
          if (val === null) return 'NULL';
          if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`; // Escape single quotes
          if (typeof val === 'number') return val;
          if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
          return `'${val}'`; // Default case
        }).join(', ');
        
        // Log a short preview of each row
        console.log(`Inserting company: ${record.name || 'Unknown'} (${record.slug || 'no-slug'})`);
        
        // Construct and execute the complete INSERT query
        const insertQuery = `
          INSERT INTO "companies" (${columnString})
          VALUES (${valueString})
          ON CONFLICT DO NOTHING
        `;
        
        await sql.query(insertQuery);
        insertedCount++;
      } catch (insertErr: any) {
        console.error(`Error inserting company:`, insertErr.message);
      }
    }
    
    console.log(`\nSuccessfully inserted ${insertedCount} of ${records.length} companies`);
    
    // Verify the insert
    const countQuery = `SELECT COUNT(*) as count FROM "companies"`;
    const countResult = await sql.query(countQuery);
    console.log(`Companies table now contains ${countResult.rows[0].count} rows`);
    
    console.log('\nImport completed!');
    
  } catch (err: any) {
    console.error('Import failed:', err.message);
  } finally {
    setTimeout(() => process.exit(0), 500);
  }
}

// Run the import
main();