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

  const { campaign_id } = req.query;

  if (!campaign_id) {
    return res.status(400).json({ error: 'Campaign ID is required' });
  }

  try {
    const client = await pool.connect();
    
    try {
      // Get stages with lead counts
      const query = `
        SELECT 
          ps.id,
          ps.name,
          ps.slug,
          ps.order_index,
          ps.color,
          ps.is_active,
          COUNT(l.id) as lead_count
        FROM pipeline_stages ps
        LEFT JOIN leads l ON ps.id = l.current_stage_id
        WHERE ps.campaign_id = $1 AND ps.is_active = true
        GROUP BY ps.id, ps.name, ps.slug, ps.order_index, ps.color, ps.is_active
        ORDER BY ps.order_index
      `;
      
      const result = await client.query(query, [campaign_id]);
      
      return res.status(200).json({
        success: true,
        stages: result.rows
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching pipeline stages:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch pipeline stages' 
    });
  }
}