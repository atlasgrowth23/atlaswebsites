
import { createClient } from '@/lib/supabase/client';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create a Supabase client with the service role key
    const supabase = createClient(true); // Use service role
    
    // Insert the image data directly - Supabase will create the table if needed
    const { data, error } = await supabase
      .from('frames')
      .insert([
        {
          template_key: 'moderntrust',
          frame_name: 'hero_img',
          image_url: 'https://media.istockphoto.com/id/2154707821/photo/air-conditioner-service-the-air-conditioner-technician-is-using-a-gauge-to-measure-the.jpg?s=612x612&w=0&k=20&c=I-EvZdWGrPOTJcmFUYqCohZ3raVYnV-QFhS2CBiCI8Q='
        }
      ])
      .select();

    if (error) {
      console.error('Error inserting frame:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: error.message });
  }
}
