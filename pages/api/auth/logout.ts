import { NextApiRequest, NextApiResponse } from 'next';
import { deleteAdminSession } from '@/lib/auth-google';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get session token from cookie
    const sessionToken = req.cookies.admin_session;

    if (sessionToken) {
      // Delete session from database
      await deleteAdminSession(sessionToken);
    }

    // Clear the session cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.setHeader('Set-Cookie', [
      `admin_session=; HttpOnly; Secure=${isProduction}; SameSite=Lax; Path=/; Max-Age=0`
    ]);

    res.status(200).json({ success: true, message: 'Logged out successfully' });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
}