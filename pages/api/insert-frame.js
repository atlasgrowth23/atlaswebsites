
import { createClient } from '@/lib/supabase/client';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('API route called - inserting frame');
    
    // Log environment vars (redacted for security)
    console.log('Environment check:', {
      url_exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anon_key_exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      service_key_exists: !!process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY
    });
    
    // Create a Supabase client with the service role key
    const supabase = createClient(true); // Use service role
    console.log('Supabase client created');
    
    // Insert the image data directly - Supabase will create the table if needed
    console.log('Attempting to insert frame');
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
      return res.status(500).json({ error: error.message, details: error });
    }

    console.log('Frame inserted successfully:', data);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: error.message, stack: error.stack });
  }
}
