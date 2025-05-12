
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY}`
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

    const data = await response.text();
    
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
