import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminSession, isAdminEmail } from '@/lib/auth-google';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, error, state } = req.query;

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error);
    return res.redirect('/admin/login?error=oauth_error');
  }

  if (!code || typeof code !== 'string') {
    return res.redirect('/admin/login?error=no_code');
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      throw new Error('No access token received');
    }

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userInfo = await userResponse.json();
    const { email, name } = userInfo;

    // Check if user is authorized admin
    if (!isAdminEmail(email)) {
      console.log(`Unauthorized login attempt: ${email}`);
      return res.redirect('/admin/login?error=unauthorized');
    }

    // Create admin session
    const sessionToken = await createAdminSession(email, name, tokens);

    // Set secure session cookie (Replit uses HTTPS so always use Secure)
    const hostname = req.headers.host || '';
    const isSecure = hostname.includes('replit.dev') || hostname.includes('atlasgrowth.ai') || process.env.NODE_ENV === 'production';
    
    const cookieOptions = [
      `admin_session=${sessionToken}`,
      'HttpOnly',
      `Secure=${isSecure}`,
      'SameSite=Lax',
      'Path=/',
      `Max-Age=${7 * 24 * 60 * 60}` // 7 days
    ].join('; ');
    
    res.setHeader('Set-Cookie', cookieOptions);
    
    console.log(`🍪 Setting cookie for ${hostname}: Secure=${isSecure}`);

    // Redirect to admin dashboard
    console.log(`✅ Admin login successful: ${email}`);
    res.redirect('/admin/pipeline?login=success');

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect('/admin/login?error=auth_failed');
  }
}