import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the authenticated user from Supabase session
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    // Use Supabase auth to get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user?.email) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    // Get user data from tk_contacts table (not client_users)
    const { data: clientUser, error: userError } = await supabase
      .from('tk_contacts')
      .select(`
        id,
        company_id,
        owner_email,
        owner_name,
        companies (
          id,
          name,
          logo_storage_path,
          slug
        )
      `)
      .eq('owner_email', user.email)
      .single();

    if (userError || !clientUser) {
      console.error('User lookup error:', userError);
      console.log('Looking for user email:', user.email);
      return res.status(404).json({ 
        error: 'User not found in tk_contacts',
        email: user.email,
        debug: userError?.message 
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: clientUser.id,
        company_id: clientUser.company_id,
        email: clientUser.owner_email,
        name: clientUser.owner_name
      },
      company: clientUser.companies
    });

  } catch (error) {
    console.error('User data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}