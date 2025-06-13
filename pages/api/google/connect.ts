import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/google/callback`;
    const scope = 'https://www.googleapis.com/auth/contacts';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent`;

    res.redirect(authUrl);
  } catch (error) {
    console.error('Google connect error:', error);
    res.status(500).json({ error: 'Failed to initiate Google OAuth' });
  }
}