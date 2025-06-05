import { NextApiRequest, NextApiResponse } from 'next';

// Simple, reliable admin detection for analytics
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Simple admin detection - only check for authenticated admin session
    const adminToken = req.cookies['admin-token'];
    const adminSession = req.cookies['admin-session'];
    
    // If user is authenticated as admin, they are admin
    if (adminSession === 'authenticated' && adminToken) {
      return res.status(200).json({ isAdmin: true });
    }

    // Default: not admin (external user)
    return res.status(200).json({ isAdmin: false });

  } catch (error) {
    console.error('Admin check error:', error);
    // On error, assume not admin for safety
    return res.status(200).json({ isAdmin: false });
  }
}