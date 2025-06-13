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

  try {
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT access_token FROM google_tokens WHERE user_email = $1',
        ['nicholas@atlasgrowth.ai']
      );

      const connected = result.rows.length > 0 && result.rows[0].access_token;

      res.json({ connected: !!connected });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Google status check error:', error);
    res.json({ connected: false });
  }
}