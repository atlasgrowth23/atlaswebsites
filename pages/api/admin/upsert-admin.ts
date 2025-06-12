import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, email, name, role } = req.body;

    if (!email || !name || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Upsert admin user record in admin_profiles table
    const { data, error } = await supabase
      .from('admin_profiles')
      .upsert({
        id,
        email,
        name,
        role,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      })
      .select()
      .single();

    if (error) {
      console.error('Upsert admin user error:', error);
      return res.status(500).json({ error: 'Failed to create admin user' });
    }

    return res.status(200).json({ success: true, user: data });
  } catch (error) {
    console.error('Upsert admin API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}