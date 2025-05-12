
// Direct API approach for Supabase
const fetch = require('node-fetch');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function createTable() {
  console.log('Attempting direct SQL create table...');
  try {
    // First create the table
    const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        sql: `
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
    
    console.log('Create table response:', await createResponse.text());
    
    // Then insert the image
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
    
    console.log('Insert response:', await insertResponse.text());
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createTable()
  .then(() => console.log('Process completed'))
  .catch(err => console.error('Fatal error:', err));
