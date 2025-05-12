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
    
    console.log('Using known table names approach');
    
    // Only check tables that we've confirmed exist in the Supabase instance
    // Based on the screenshot and feedback
    const existingTableNames = [
      'companies', 
      'reviews', 
      'user_profiles' // This might not exist yet but will be created
    ];
    
    // Format table info in the expected format
    const formattedTables = [];
    
    // For each table, try to get its columns
    for (const tableName of existingTableNames) {
      try {
        console.log(`Checking table: ${tableName}`);
        const { data: columns, error: columnsError } = await supabase
          .from(tableName)
          .select()
          .limit(1);
          
        if (columnsError) {
          console.log(`Table ${tableName} might not exist:`, columnsError.message);
          
          // For user_profiles, add a placeholder if it doesn't exist yet
          if (tableName === 'user_profiles') {
            formattedTables.push({
              table_name: tableName,
              columns: [
                'id::serial',
                'user_id::uuid',
                'role::text',
                'permissions::jsonb',
                'business_slug::text',
                'created_at::timestamp'
              ],
              exists: false,
              placeholder: true,
              message: 'This table does not exist yet but can be created via Setup Database'
            });
          }
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
          const { data: tableInfo, error: tableInfoError } = await supabase
            .from(tableName)
            .select('*', { head: true, count: 'exact' });
            
          // If this also errors, the table probably doesn't exist
          if (tableInfoError) {
            console.log(`Could not verify if table ${tableName} exists:`, tableInfoError.message);
            continue;
          }
          
          // We know the table exists, but we don't know its structure
          // Let's use a general approach to get column names by making a dummy insert
          // This is a bit hacky but gives us the columns
          
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