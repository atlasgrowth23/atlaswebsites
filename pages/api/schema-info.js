import { createClient } from '@/lib/supabase/client';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create Supabase client with service role
    const supabase = createClient(true);

    // Query for table information
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            table_name,
            array_agg(
              column_name || '::' || data_type
              ORDER BY ordinal_position
            ) as columns
          FROM 
            information_schema.columns
          WHERE 
            table_schema = 'public'
          GROUP BY 
            table_name
          ORDER BY 
            table_name;
        `
      });

    if (tablesError) {
      throw tablesError;
    }

    return res.status(200).json({ 
      success: true, 
      tables,
      env: {
        url_exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        anon_key_exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        service_key_exists: !!process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY
      }
    });
  } catch (error) {
    console.error('Error fetching schema:', error);
    return res.status(500).json({ 
      error: error.message,
      env: {
        url_exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        anon_key_exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        service_key_exists: !!process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY
      }
    });
  }
}