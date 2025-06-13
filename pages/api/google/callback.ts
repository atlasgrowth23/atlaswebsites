import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' });
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code: code as string,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/google/callback`
      })
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokens.error}`);
    }

    // Store tokens in database
    const client = await pool.connect();
    
    try {
      // Create table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS google_tokens (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_email VARCHAR(255) UNIQUE NOT NULL,
          access_token TEXT,
          refresh_token TEXT,
          expires_at BIGINT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);

      const userEmail = 'nicholas@atlasgrowth.ai'; // Hardcoded for now

      await client.query(`
        INSERT INTO google_tokens (user_email, access_token, refresh_token, expires_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_email) 
        DO UPDATE SET 
          access_token = EXCLUDED.access_token,
          refresh_token = EXCLUDED.refresh_token,
          expires_at = EXCLUDED.expires_at,
          updated_at = NOW()
      `, [
        userEmail,
        tokens.access_token,
        tokens.refresh_token,
        Date.now() + (tokens.expires_in * 1000)
      ]);

      console.log('✅ Google tokens stored successfully');
      
    } finally {
      client.release();
    }

    // Redirect back to contacts page with success
    res.redirect('/admin/contacts?google=connected');
    
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect('/admin/contacts?google=error');
  }
}