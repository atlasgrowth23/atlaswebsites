import { NextApiRequest, NextApiResponse } from 'next';
import { createUser } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, name, role = 'viewer', states = ['Alabama', 'Arkansas'] } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }

  try {
    const user = await createUser(email, password, role, states, name);
    
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email
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