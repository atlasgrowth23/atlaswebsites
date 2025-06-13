import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminSession } from '@/lib/auth-google';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionToken = req.cookies.admin_session;
    
    if (!sessionToken) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const session = await getAdminSession(sessionToken);
    
    if (!session) {
      return res.status(401).json({ success: false, error: 'Invalid session' });
    }

    res.status(200).json({
      success: true,
      user: {
        email: session.email,
        role: session.role,
        name: session.name
      }
    });

  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}