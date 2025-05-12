
// Direct API approach for Supabase
const fetch = require('node-fetch');

// Get environment variables directly
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY;

console.log('Starting direct insert into frames table...');

// Skip the table creation using rpc/exec_sql since it's failing
// Instead, insert directly and let Supabase create the table if needed
async function insertImage() {
  try {
    console.log('Inserting image into frames table...');
    
    // Insert the image directly
    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/frames`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        template_key: 'moderntrust',
        frame_name: 'hero_img',
        image_url: 'https://media.istockphoto.com/id/2154707821/photo/air-conditioner-service-the-air-conditioner-technician-is-using-a-gauge-to-measure-the.jpg?s=612x612&w=0&k=20&c=I-EvZdWGrPOTJcmFUYqCohZ3raVYnV-QFhS2CBiCI8Q='
      })
    });
    
    const insertData = await insertResponse.json();
    console.log('Insert response:', insertData);
    
    return insertData;
  } catch (error) {
    console.error('Error inserting image:', error);
    throw error;
  }
}

// Run the function
insertImage()
  .then(result => {
    console.log('Successfully inserted image:', result);
  })
  .catch(error => {
    console.error('Failed to insert image:', error);
  });
