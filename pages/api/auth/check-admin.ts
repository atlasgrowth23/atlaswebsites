import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Admin detection via Supabase auth and admin_users table
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const token = req.cookies['sb-access-token'] || req.cookies['supabase-auth-token'];
    
    if (!token) {
      return res.status(200).json({ isAdmin: false });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user?.email) {
      return res.status(200).json({ isAdmin: false });
    }

    // Check against admin_users table
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: adminUser } = await serviceSupabase
      .from('admin_users')
      .select('role, is_active')
      .eq('email', user.email)
      .eq('is_active', true)
      .single();
    
    return res.status(200).json({ isAdmin: !!adminUser });

  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(200).json({ isAdmin: false });
  }
}