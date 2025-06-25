import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          c.id,
          c.name,
          c.description,
          c.status,
          c.created_at,
          bt.name as business_type,
          r.name as region
        FROM campaigns c
        JOIN business_types bt ON c.business_type_id = bt.id
        JOIN regions r ON c.region_id = r.id
        ORDER BY c.created_at DESC
      `;
      
      const result = await client.query(query);
      
      return res.status(200).json({
        success: true,
        campaigns: result.rows
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch campaigns' 
    });
  }
}