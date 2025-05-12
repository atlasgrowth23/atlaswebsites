import { neon } from '@neondatabase/serverless';
import { createClient } from '@supabase/supabase-js';

// Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Replit PostgreSQL connection
const sql = neon(process.env.DATABASE_URL!);

// Tables we know exist in Supabase
const knownTables = ['companies', 'reviews', 'frames', 'companies_frames'];

async function main() {
  try {
    console.log('Starting migration from Supabase to Replit PostgreSQL...');
    console.log('Supabase URL:', supabaseUrl);
    
    // First, check if the Replit database is properly connected
    console.log('\nChecking Replit database connection...');
    const dbInfo = await sql`SELECT current_database() as db_name, version()`;
    console.log('Connected to database:', dbInfo[0].db_name);
    console.log('PostgreSQL version:', dbInfo[0].version);
    
    // Create each table and migrate data
    for (const tableName of knownTables) {
      try {
        console.log(`\nProcessing table: ${tableName}`);
        
        // Check if the table exists in Supabase
        const { data: sampleData, error: sampleError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
          
        if (sampleError) {
          console.error(`Error accessing table ${tableName} in Supabase:`, sampleError);
          continue;
        }
        
        if (!sampleData || sampleData.length === 0) {
          console.log(`No data found in table ${tableName}`);
          continue;
        }
        
        // Get column names from the sample data
        const columns = Object.keys(sampleData[0]);
        console.log(`Found ${columns.length} columns for table ${tableName}`);
        
        // Create the table in Replit PostgreSQL
        const columnDefinitions = columns.map(col => {
          // Infer data type based on the sample data
          let dataType = 'TEXT';
          const value = sampleData[0][col];
          
          if (typeof value === 'number') {
            dataType = Number.isInteger(value) ? 'INTEGER' : 'NUMERIC';
          } else if (typeof value === 'boolean') {
            dataType = 'BOOLEAN';
          } else if (value instanceof Date) {
            dataType = 'TIMESTAMP';
          } else if (value === null) {
            dataType = 'TEXT'; // Default for null values
          }
          
          return `"${col}" ${dataType}`;
        }).join(', ');
        
        // Create the table if it doesn't exist
        await sql`CREATE TABLE IF NOT EXISTS "${tableName}" (${sql.raw(columnDefinitions)})`;
        console.log(`Table ${tableName} created or already exists`);
        
        // Get all data from Supabase for this table
        const { data: allData, error: dataError } = await supabase
          .from(tableName)
          .select('*');
          
        if (dataError) {
          console.error(`Error fetching all data from ${tableName}:`, dataError);
          continue;
        }
        
        if (!allData || allData.length === 0) {
          console.log(`No data found in table ${tableName}`);
          continue;
        }
        
        console.log(`Found ${allData.length} rows in table ${tableName}`);
        
        // Insert data row by row to avoid issues with complex data structures
        let insertedCount = 0;
        for (const row of allData) {
          try {
            const columnNames = Object.keys(row).map(col => `"${col}"`).join(', ');
            const placeholders = Object.keys(row).map((_, i) => `$${i + 1}`).join(', ');
            const values = Object.values(row);
            
            // For logging
            const logRow = JSON.stringify(row).substring(0, 100) + 
                          (JSON.stringify(row).length > 100 ? '...' : '');
            console.log(`Inserting row: ${logRow}`);
            
            // Using raw SQL with parameterized values for safer inserts
            await sql`
              INSERT INTO "${tableName}" (${sql.raw(columnNames)})
              VALUES (${sql.raw(placeholders)})
              ON CONFLICT DO NOTHING
            `.set(...values);
            
            insertedCount++;
          } catch (insertErr) {
            console.error(`Error inserting row:`, insertErr);
          }
        }
        
        console.log(`Successfully inserted ${insertedCount} rows into ${tableName}`);
        
        // Verify the insert
        const count = await sql`SELECT COUNT(*) as count FROM "${tableName}"`;
        console.log(`Table ${tableName} now contains ${count[0].count} rows`);
        
      } catch (tableErr) {
        console.error(`Error processing table ${tableName}:`, tableErr);
      }
    }
    
    console.log('\nMigration completed!');
    
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    setTimeout(() => process.exit(0), 500);
  }
}

// Run the migration
main();