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
        results.push({ table: 'user_profiles', success: false, error: countError.message });
      } else if (countError && countError.code === 'PGRST116') {
        // Table doesn't exist, attempt to create it through a simplified approach
        console.log('User profiles table does not exist, marking as pending creation');
        results.push({ 
          table: 'user_profiles', 
          success: false, 
          status: 'pending_creation',
          message: 'Table needs to be created manually or through migration tool' 
        });
      } else {
        console.log('User profiles table already exists');
        results.push({ table: 'user_profiles', success: true, status: 'exists' });
      }
      
      // Repeat for chat_messages table
      console.log('Checking chat_messages table');
      const { count: msgCount, error: msgCountError } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true });
      
      if (msgCountError && msgCountError.code !== 'PGRST116') {
        console.error('Error checking chat_messages table:', msgCountError);
        results.push({ table: 'chat_messages', success: false, error: msgCountError.message });
      } else if (msgCountError && msgCountError.code === 'PGRST116') {
        console.log('Chat messages table does not exist, marking as pending creation');
        results.push({ 
          table: 'chat_messages', 
          success: false, 
          status: 'pending_creation',
          message: 'Table needs to be created manually or through migration tool'
        });
      } else {
        console.log('Chat messages table already exists');
        results.push({ table: 'chat_messages', success: true, status: 'exists' });
      }
      
      // Repeat for chat_configurations table
      console.log('Checking chat_configurations table');
      const { count: configCount, error: configCountError } = await supabase
        .from('chat_configurations')
        .select('*', { count: 'exact', head: true });
      
      if (configCountError && configCountError.code !== 'PGRST116') {
        console.error('Error checking chat_configurations table:', configCountError);
        results.push({ table: 'chat_configurations', success: false, error: configCountError.message });
      } else if (configCountError && configCountError.code === 'PGRST116') {
        console.log('Chat configurations table does not exist, marking as pending creation');
        results.push({ 
          table: 'chat_configurations', 
          success: false,
          status: 'pending_creation',
          message: 'Table needs to be created manually or through migration tool'
        });
      } else {
        console.log('Chat configurations table already exists');
        results.push({ table: 'chat_configurations', success: true, status: 'exists' });
      }
      
      // Create a special message to guide the user
      const setupInstructions = `
To complete database setup, please create the following tables in Supabase:

1. user_profiles:
   - id: serial primary key
   - user_id: uuid, references auth.users(id)
   - role: text (values: 'super_admin', 'admin', 'staff', 'business', 'demo')
   - permissions: jsonb
   - business_slug: text
   - created_at: timestamptz

2. chat_messages:
   - id: serial primary key
   - business_slug: text
   - sender_name: text
   - sender_email: text
   - message: text
   - timestamp: timestamptz
   - read: boolean
   - responded: boolean
   - response_text: text
   - response_timestamp: timestamptz

3. chat_configurations:
   - business_slug: text primary key
   - greeting_message: text
   - primary_color: text
   - auto_responses: jsonb
   - active_hours: jsonb
   - created_at: timestamptz
   - updated_at: timestamptz
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