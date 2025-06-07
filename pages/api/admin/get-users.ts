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
    // Check if user is Nicholas (super admin only)
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
      
      if (!decoded || decoded.email !== 'nicholas@atlasgrowth.ai') {
        return res.status(403).json({ error: 'Access denied. Super admin only.' });
      }
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Fetch all user accounts from tk_contacts with company information
    const { data: users, error } = await supabase
      .from('tk_contacts')
      .select(`
        id,
        owner_email,
        owner_name,
        company_id,
        created_at,
        updated_at,
        companies (
          id,
          name,
          logo_storage_path
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    // Transform data for frontend
    const transformedUsers = users?.map(user => ({
      id: user.id,
      email: user.owner_email,
      owner_name: user.owner_name,
      company_id: user.company_id,
      company_name: user.companies?.name || 'No Company',
      logo_url: user.companies?.logo_storage_path || '',
      created_at: user.created_at,
      updated_at: user.updated_at
    })) || [];

    res.status(200).json({ users: transformedUsers });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}