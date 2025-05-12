
// Script to create the frames table and add image
const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY;

// Initialize Supabase client with service key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupFramesTable() {
  console.log('Starting setup process...');
  
  try {
    // Check if table exists
    const { error: checkError } = await supabase
      .from('frames')
      .select('*')
      .limit(1);
    
    // Create table if it doesn't exist
    if (checkError && checkError.code === '42P01') {
      console.log('Frames table does not exist. Creating it...');
      
      // Using RPC to execute SQL - create table
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS frames (
            id SERIAL PRIMARY KEY,
            template_key TEXT NOT NULL,
            frame_name TEXT NOT NULL,
            image_url TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      });
      
      if (createError) {
        // If RPC fails, the table might not exist yet
        console.log('Creating table using alternative method...');
        // We'll use REST API
        await supabase.auth.getSession();
        
        // Try direct SQL API access using authenticated client
        const result = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            query: `
              CREATE TABLE IF NOT EXISTS frames (
                id SERIAL PRIMARY KEY,
                template_key TEXT NOT NULL,
                frame_name TEXT NOT NULL,
                image_url TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
              );
            `
          })
        });
        
        console.log('Table creation result:', await result.text());
      }
    }
    
    // Insert the image data into the frames table
    console.log('Inserting image into frames table...');
    const { data, error: insertError } = await supabase
      .from('frames')
      .insert([
        {
          template_key: 'moderntrust',
          frame_name: 'hero_img',
          image_url: 'https://media.istockphoto.com/id/2154707821/photo/air-conditioner-service-the-air-conditioner-technician-is-using-a-gauge-to-measure-the.jpg?s=612x612&w=0&k=20&c=I-EvZdWGrPOTJcmFUYqCohZ3raVYnV-QFhS2CBiCI8Q='
        }
      ])
      .select();
    
    if (insertError) {
      console.error('Error inserting image:', insertError);
    } else {
      console.log('Image added successfully:', data);
    }
    
  } catch (error) {
    console.error('Setup error:', error);
  }
}

setupFramesTable()
  .then(() => console.log('Setup completed'))
  .catch(err => console.error('Fatal error:', err));
