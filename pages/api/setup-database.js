import { createClient } from '@/lib/supabase/client';

export default async function handler(req, res) {
  console.log('Setup database API called:', new Date().toISOString());
  console.log('Request method:', req.method);
  
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Creating Supabase client with service role');
    // Create Supabase client with service role
    const supabase = createClient(true);

    const results = [];
    console.log('Starting database table creation');

    try {
      // Create user_profiles table using Supabase SQL API
      console.log('Creating user_profiles table');
      
      // Check if the table already exists
      const { count, error: countError } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });
      
      if (countError && countError.code !== 'PGRST116') {
        // Only consider it an error if it's not a "table doesn't exist" error
        console.error('Error checking user_profiles table:', countError);
        results.push({ 
          table: 'user_profiles', 
          success: false, 
          error: countError.message 
        });
      } else if (countError && countError.code === 'PGRST116') {
        // Table doesn't exist, we should create it
        console.log('User profiles table does not exist, will provide SQL to create it');
        results.push({ 
          table: 'user_profiles', 
          success: false, 
          status: 'not_exists',
          message: 'Table needs to be created in the Supabase SQL editor' 
        });
      } else {
        console.log('User profiles table already exists');
        results.push({ 
          table: 'user_profiles', 
          success: true, 
          status: 'exists' 
        });
      }
      
      // Create a special message to guide the user
      const setupInstructions = `
# Supabase Database Setup Instructions

To complete setting up your HVAC Portal, you'll need to create the user_profiles table in your Supabase database.

## How to Create the Table:

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to the "SQL Editor" section
4. Create a new query
5. Paste the following SQL:

\`\`\`sql
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'staff', 'business', 'demo')),
  permissions JSONB DEFAULT '{}',
  business_slug TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an initial admin user (optional)
-- You will need to create a user in Auth first, then use its UUID here
-- INSERT INTO user_profiles (user_id, role, business_slug) 
-- VALUES ('replace-with-actual-uuid', 'admin', 'your-business-name');
\`\`\`

6. Run the SQL query
7. Refresh your schema page to see the new table

After creating the table, you can log in to the HVAC Portal with a Supabase Auth account.
`;

      console.log('Database check complete. Results:', results);
      return res.status(200).json({ 
        success: true, 
        results,
        setupInstructions
      });
    } catch (error) {
      console.error('Error in database setup process:', error);
      return res.status(500).json({ 
        error: error.message,
        message: 'Error in database setup process'
      });
    }
    
  } catch (error) {
    console.error('Error setting up database:', error);
    return res.status(500).json({ error: error.message });
  }
}