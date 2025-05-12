import { sql } from '../lib/db';
import { createClient } from '@supabase/supabase-js';

// Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Tables we know exist in Supabase
const knownTables = ['companies', 'reviews', 'frames', 'companies_frames'];

async function getSupabaseSchema() {
  console.log('Getting schema information from Supabase...');
  
  const tableSchemas = {};
  
  for (const tableName of knownTables) {
    try {
      console.log(`\nGetting schema for ${tableName}...`);
      
      // Get column information from Supabase
      const { data: columns, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', tableName);
      
      if (error) {
        console.error(`Error getting schema for ${tableName}:`, error);
        continue;
      }
      
      if (!columns || columns.length === 0) {
        console.warn(`No columns found for table ${tableName}`);
        continue;
      }
      
      console.log(`Found ${columns.length} columns for ${tableName}`);
      tableSchemas[tableName] = columns;
      
    } catch (err) {
      console.error(`Error processing table ${tableName}:`, err);
    }
  }
  
  return tableSchemas;
}

async function createTablesInReplitDb(schemas) {
  console.log('\nCreating tables in Replit database...');
  
  for (const [tableName, columns] of Object.entries(schemas)) {
    try {
      console.log(`\nCreating table ${tableName}...`);
      
      // Generate CREATE TABLE statement
      let createTableSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
      
      // Generate column definitions
      for (let i = 0; i < columns.length; i++) {
        const column = columns[i];
        let columnDef = `  "${column.column_name}" ${column.data_type}`;
        
        // Add NOT NULL constraint if applicable
        if (column.is_nullable === 'NO') {
          columnDef += ' NOT NULL';
        }
        
        // Add default value if specified
        if (column.column_default) {
          columnDef += ` DEFAULT ${column.column_default}`;
        }
        
        // Add comma if not the last column
        if (i < columns.length - 1) {
          columnDef += ',';
        }
        
        createTableSQL += columnDef + '\n';
      }
      
      createTableSQL += ');';
      
      console.log('Executing SQL:');
      console.log(createTableSQL);
      
      // Execute CREATE TABLE statement
      await sql.query(createTableSQL);
      console.log(`Table ${tableName} created successfully!`);
      
    } catch (err) {
      console.error(`Error creating table ${tableName}:`, err);
    }
  }
}

async function migrateTableData(schemas) {
  console.log('\nMigrating data from Supabase to Replit database...');
  
  for (const tableName of Object.keys(schemas)) {
    try {
      console.log(`\nMigrating data for ${tableName}...`);
      
      // Get data from Supabase
      const { data: rows, error } = await supabase
        .from(tableName)
        .select('*');
      
      if (error) {
        console.error(`Error fetching data from ${tableName}:`, error);
        continue;
      }
      
      if (!rows || rows.length === 0) {
        console.log(`No data found for table ${tableName}`);
        continue;
      }
      
      console.log(`Found ${rows.length} rows for ${tableName}`);
      
      // Insert data into Replit database
      for (const row of rows) {
        const columns = Object.keys(row);
        const values = Object.values(row);
        
        // Generate placeholders for prepared statement
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        
        const insertSQL = `
          INSERT INTO ${tableName} (${columns.join(', ')})
          VALUES (${placeholders})
          ON CONFLICT DO NOTHING;
        `;
        
        await sql.query(insertSQL, values);
      }
      
      console.log(`Successfully migrated ${rows.length} rows to ${tableName}`);
      
    } catch (err) {
      console.error(`Error migrating data for ${tableName}:`, err);
    }
  }
}

async function main() {
  try {
    // Get schema information from Supabase
    const schemas = await getSupabaseSchema();
    
    // Create tables in Replit database
    await createTablesInReplitDb(schemas);
    
    // Migrate data from Supabase to Replit database
    await migrateTableData(schemas);
    
    console.log('\nMigration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

main();