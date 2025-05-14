import { sql } from '../lib/db';
import { createClient } from '@supabase/supabase-js';

// Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Tables we know exist in Supabase
const knownTables = ['companies', 'reviews', 'frames', 'companies_frames'];

// Define types
interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface TableSchemas {
  [tableName: string]: ColumnInfo[];
}

async function getSupabaseSchema(): Promise<TableSchemas> {
  console.log('Getting schema information from Supabase...');
  
  const tableSchemas: TableSchemas = {};
  
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
        console.log(`Trying direct query for table ${tableName}...`);
        
        // Try an alternative approach - directly query a row and extract column names
        const { data: sampleData, error: sampleError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
          
        if (sampleError || !sampleData || sampleData.length === 0) {
          console.warn(`No data or schema found for table ${tableName}`);
          continue;
        }
        
        // Create basic column definitions from the sample data
        const basicColumns: ColumnInfo[] = Object.keys(sampleData[0]).map(colName => ({
          column_name: colName,
          data_type: typeof sampleData[0][colName] === 'number' ? 'numeric' : 
                     typeof sampleData[0][colName] === 'boolean' ? 'boolean' : 'text',
          is_nullable: 'YES',
          column_default: null
        }));
        
        console.log(`Inferred ${basicColumns.length} columns for ${tableName} from sample data`);
        tableSchemas[tableName] = basicColumns;
        continue;
      }
      
      console.log(`Found ${columns.length} columns for ${tableName}`);
      tableSchemas[tableName] = columns as ColumnInfo[];
      
    } catch (err) {
      console.error(`Error processing table ${tableName}:`, err);
    }
  }
  
  return tableSchemas;
}

async function createTablesInReplitDb(schemas: TableSchemas): Promise<void> {
  console.log('\nCreating tables in Replit database...');
  
  for (const [tableName, columns] of Object.entries(schemas)) {
    try {
      console.log(`\nCreating table ${tableName}...`);
      
      // Generate column definitions
      const columnDefs = columns.map((column, i) => {
        let columnDef = `"${column.column_name}" ${column.data_type}`;
        
        // Add NOT NULL constraint if applicable
        if (column.is_nullable === 'NO') {
          columnDef += ' NOT NULL';
        }
        
        // Add default value if specified
        if (column.column_default) {
          columnDef += ` DEFAULT ${column.column_default}`;
        }
        
        return columnDef;
      }).join(',\n  ');
      
      // Using template literals for the SQL query
      await sql`
        CREATE TABLE IF NOT EXISTS ${sql(tableName)} (
          ${sql(columnDefs)}
        );
      `;
      
      console.log(`Table ${tableName} created successfully!`);
      
    } catch (err) {
      console.error(`Error creating table ${tableName}:`, err);
    }
  }
}

async function migrateTableData(schemas: TableSchemas): Promise<void> {
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
      
      // We'll process in batches of 50 records
      const batchSize = 50;
      let processed = 0;
      
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        
        for (const row of batch) {
          try {
            // Get column names and values
            const columns = Object.keys(row);
            const values = Object.values(row);
            
            // Build dynamic SQL insert
            const columnsSQL = columns.join(', ');
            const placeholders = columns.map(() => '?').join(', ');
            
            // Build the SQL query dynamically (this is more complex with neon)
            // Instead of using parameterized queries for column names (which isn't possible)
            // we'll build a custom query per row
            
            // For demonstration, we'll do this differently...
            // Convert the row to a string representation for logging
            const rowStr = JSON.stringify(row);
            console.log(`Inserting row: ${rowStr.substring(0, 100)}${rowStr.length > 100 ? '...' : ''}`);
            
            // Build a dynamic SQL query with proper escaping
            const columnPlaceholders = columns.map(col => `"${col}"`).join(', ');
            const valuePlaceholders = values.map(val => {
              if (val === null) return 'NULL';
              if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
              return val;
            }).join(', ');
            
            await sql`
              INSERT INTO ${sql(tableName)} (${sql(columns.join(', '))})
              VALUES (${sql(valuePlaceholders)})
              ON CONFLICT DO NOTHING
            `;
            
            processed++;
          } catch (insertErr) {
            console.error(`Error inserting row into ${tableName}:`, insertErr);
          }
        }
        
        console.log(`Processed ${Math.min(i + batchSize, rows.length)} of ${rows.length} rows`);
      }
      
      console.log(`Successfully migrated ${processed} rows to ${tableName}`);
    } catch (err) {
      console.error(`Error migrating data for ${tableName}:`, err);
    }
  }
}

async function main() {
  try {
    console.log('Starting migration from Supabase to Replit PostgreSQL...');
    console.log('Supabase URL:', supabaseUrl);
    
    // First, check if the Replit database is properly connected
    console.log('\nChecking Replit database connection...');
    const dbInfo = await sql`SELECT current_database() as db_name, version()`;
    console.log('Connected to database:', dbInfo[0].db_name);
    console.log('PostgreSQL version:', dbInfo[0].version);
    
    // Get schema information from Supabase
    const schemas = await getSupabaseSchema();
    console.log('\nSchema information retrieved:', Object.keys(schemas).join(', '));
    
    // Create tables in Replit database
    await createTablesInReplitDb(schemas);
    
    // Migrate data from Supabase to Replit database
    await migrateTableData(schemas);
    
    // Verify the migration by checking record counts
    console.log('\nVerifying migration...');
    for (const tableName of Object.keys(schemas)) {
      try {
        const countResult = await sql`SELECT COUNT(*) as count FROM ${sql(tableName)}`;
        console.log(`Table ${tableName} contains ${countResult[0].count} rows in Replit database`);
      } catch (err) {
        console.error(`Error counting rows in ${tableName}:`, err);
      }
    }
    
    console.log('\nMigration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    // We'll exit with a slight delay to ensure logs are flushed
    setTimeout(() => process.exit(0), 500);
  }
}

// Run the migration
main();