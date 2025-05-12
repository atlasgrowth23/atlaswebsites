import { createClient } from '@/lib/supabase/client';

export default async function handler(req, res) {
  console.log('Schema info API called:', new Date().toISOString());
  console.log('Request method:', req.method);
  
  if (req.method !== 'GET') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Creating Supabase client with service role');
    // Create Supabase client with service role
    const supabase = createClient(true);
    
    // Format table info in the expected format
    const formattedTables = [];
    
    try {
      // First try to get list of all tables from the database directly
      // Using the information_schema which should work on all PostgreSQL databases
      console.log('Fetching tables from information_schema');
      const { data: tablesList, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .not('table_name', 'like', 'pg_%');  // Exclude PostgreSQL system tables
        
      if (tablesError) {
        console.log('Failed to fetch from information_schema, falling back to known tables');
        
        // Use a fallback list of tables we know should exist
        const knownTableNames = ['companies', 'reviews'];
        
        // For each table, try to get its columns
        for (const tableName of knownTableNames) {
          try {
            console.log(`Checking table: ${tableName}`);
            const { data: columns, error: columnsError } = await supabase
              .from(tableName)
              .select()
              .limit(1);
              
            if (columnsError) {
              console.log(`Table ${tableName} might not exist:`, columnsError.message);
              continue;
            }
            
            // If we have data, extract column names
            if (columns && columns.length > 0) {
              const columnsList = Object.keys(columns[0]).map(col => `${col}::unknown`);
              formattedTables.push({
                table_name: tableName,
                columns: columnsList,
                exists: true
              });
              console.log(`Table ${tableName} exists with columns:`, columnsList);
            } else {
              // Table exists but is empty
              formattedTables.push({
                table_name: tableName,
                columns: [],
                exists: true,
                empty: true
              });
              console.log(`Table ${tableName} exists but is empty`);
            }
          } catch (err) {
            console.error(`Error processing table ${tableName}:`, err);
          }
        }
      } else if (tablesList && tablesList.length > 0) {
        // Successfully got table list from information_schema
        console.log(`Found ${tablesList.length} tables from information_schema`);
        
        // Process each table to get its columns
        for (const table of tablesList) {
          const tableName = table.table_name;
          try {
            console.log(`Checking table: ${tableName}`);
            const { data: columns, error: columnsError } = await supabase
              .from(tableName)
              .select()
              .limit(1);
              
            if (columnsError) {
              console.log(`Error fetching data from ${tableName}:`, columnsError.message);
              continue;
            }
            
            // If we have data, extract column names
            if (columns && columns.length > 0) {
              const columnsList = Object.keys(columns[0]).map(col => `${col}::unknown`);
              formattedTables.push({
                table_name: tableName,
                columns: columnsList,
                exists: true
              });
              console.log(`Table ${tableName} exists with columns:`, columnsList);
            } else {
              // Table exists but is empty
              formattedTables.push({
                table_name: tableName,
                columns: [],
                exists: true,
                empty: true
              });
              console.log(`Table ${tableName} exists but is empty`);
            }
          } catch (err) {
            console.error(`Error processing table ${tableName}:`, err);
          }
        }
      } else {
        console.log('No tables found in information_schema');
      }
    } catch (err) {
      console.error('Error querying database schema:', err);
      
      // Last resort fallback to known tables
      const knownTableNames = ['companies', 'reviews'];
      
      // For each table, try to get its columns
      for (const tableName of knownTableNames) {
        try {
          console.log(`Checking table: ${tableName}`);
          const { data: columns, error: columnsError } = await supabase
            .from(tableName)
            .select()
            .limit(1);
            
          if (columnsError) {
            console.log(`Table ${tableName} might not exist:`, columnsError.message);
            continue;
          }
          
          // If we have data, extract column names
          if (columns && columns.length > 0) {
            const columnsList = Object.keys(columns[0]).map(col => `${col}::unknown`);
            formattedTables.push({
              table_name: tableName,
              columns: columnsList,
              exists: true
            });
            console.log(`Table ${tableName} exists with columns:`, columnsList);
          } else {
            // Table exists but is empty
            formattedTables.push({
              table_name: tableName,
              columns: [],
              exists: true,
              empty: true
            });
            console.log(`Table ${tableName} exists but is empty`);
          }
        } catch (err) {
          console.error(`Error processing table ${tableName}:`, err);
        }
      }
    }
    
    const envInfo = {
      url_exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anon_key_exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      service_key_exists: !!process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY
    };
    
    console.log('Environment variables check:', envInfo);

    return res.status(200).json({ 
      success: true, 
      tables: formattedTables,
      env: envInfo
    });
  } catch (error) {
    console.error('Error fetching schema:', error);
    
    const envInfo = {
      url_exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anon_key_exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      service_key_exists: !!process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY
    };
    
    console.log('Environment variables in error state:', envInfo);
    
    return res.status(500).json({ 
      error: error.message,
      env: envInfo
    });
  }
}