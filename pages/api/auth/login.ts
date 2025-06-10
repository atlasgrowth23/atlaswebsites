import { NextApiRequest, NextApiResponse } from 'next';

// Legacy login endpoint - redirects to new Google auth
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Redirect to new Google OAuth login
  res.status(200).json({
    success: false,
    message: 'Please use Google OAuth login',
    redirect: '/admin/login'
  });
}