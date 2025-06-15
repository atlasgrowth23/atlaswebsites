const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTasksTable() {
  try {
    console.log('Checking admin_tasks table...');
    
    const { data, error } = await supabase
      .from('admin_tasks')
      .select('*')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      console.log('⚠️ Table does not exist, creating it...');
      
      // Try to create some sample data to test if table creation works
      const { data: insertData, error: insertError } = await supabase
        .from('admin_tasks')
        .insert({
          title: 'Test Task',
          description: 'Testing task creation',
          assigned_to: 'Nicholas',
          priority: 'medium'
        });
        
      if (insertError) {
        console.log('❌ Table needs to be created manually in Supabase dashboard');
        console.log('Please create the admin_tasks table in Supabase SQL Editor');
      } else {
        console.log('✅ Table created successfully!');
      }
    } else if (!error) {
      console.log('✅ admin_tasks table already exists!');
      console.log(`Found ${data.length} existing tasks`);
    } else {
      console.error('Error checking table:', error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

createTasksTable();