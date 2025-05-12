
import { createClient } from '@/lib/supabase/client';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create a Supabase client with the service role key
    const serviceSupabase = createClient();
    
    // Create the frames table if it doesn't exist
    const { error: sqlError } = await serviceSupabase.rpc('exec_sql', {
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

    if (sqlError) {
      console.error('SQL Error:', sqlError);
      return res.status(500).json({ error: sqlError.message });
    }

    // Insert the image data
    const { data, error: insertError } = await serviceSupabase
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
      return res.status(500).json({ error: insertError.message });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: error.message });
  }
}
