import { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;

  // Simple password check for Nicholas and Jared
  if (password === 'atlas2024admin') {
    // Set simple auth cookies
    const adminToken = serialize('admin-token', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    const adminSession = serialize('admin-session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    res.setHeader('Set-Cookie', [adminToken, adminSession]);
    
    return res.status(200).json({
      success: true,
      message: 'Login successful'
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid password'
  });
}