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
    const dbInfo = await sql`SELECT current_database() as db_name, version()`;
    console.log('Connected to database:', dbInfo[0].db_name);
    console.log('PostgreSQL version:', dbInfo[0].version);
    
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
    await sql(createTableQuery);
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
        
        const columnNames = Object.keys(record).map(col => `"${col}"`).join(', ');
        const placeholders = Object.keys(record).map((_, i) => `$${i + 1}`).join(', ');
        const values = Object.values(record);
        
        // Log a short preview of each row
        console.log(`Inserting company: ${record.name || 'Unknown'} (${record.slug || 'no-slug'})`);
        
        await sql`
          INSERT INTO "companies" (${sql.raw(columnNames)})
          VALUES (${sql.raw(placeholders)})
          ON CONFLICT DO NOTHING
        `.set(...values);
        
        insertedCount++;
      } catch (insertErr: any) {
        console.error(`Error inserting company:`, insertErr.message);
      }
    }
    
    console.log(`\nSuccessfully inserted ${insertedCount} of ${records.length} companies`);
    
    // Verify the insert
    const count = await sql`SELECT COUNT(*) as count FROM "companies"`;
    console.log(`Companies table now contains ${count[0].count} rows`);
    
    console.log('\nImport completed!');
    
  } catch (err: any) {
    console.error('Import failed:', err.message);
  } finally {
    setTimeout(() => process.exit(0), 500);
  }
}

// Run the import
main();