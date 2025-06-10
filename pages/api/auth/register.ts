import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, name, role = 'admin' } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role
      }
    });

    if (error) {
      throw error;
    }
    
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: data.user?.id,
        email: data.user?.email
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.message?.includes('already registered')) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create user' });
  }
}