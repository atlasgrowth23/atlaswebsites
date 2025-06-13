import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Google OAuth parameters
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/contacts',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/gmail.send'
  ].join(' ');

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    scope: scopes,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent', // Force consent to get refresh token
    state: crypto.randomUUID() // CSRF protection
  });

  const authUrl = `https://accounts.google.com/o/oauth2/auth?${params.toString()}`;
  
  res.redirect(authUrl);
}