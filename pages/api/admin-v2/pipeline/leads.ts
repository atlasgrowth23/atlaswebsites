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
      const query = `
        SELECT 
          l.id,
          l.business_name,
          l.phone,
          l.email,
          l.city,
          l.state,
          l.priority,
          l.status,
          l.sms_sent_count,
          l.link_clicks,
          l.video_completed,
          l.created_at,
          l.updated_at,
          ps.name as current_stage_name,
          ps.color as stage_color
        FROM leads l
        JOIN pipeline_stages ps ON l.current_stage_id = ps.id
        WHERE l.campaign_id = $1
        ORDER BY l.updated_at DESC
      `;
      
      const result = await client.query(query, [campaign_id]);
      
      return res.status(200).json({
        success: true,
        leads: result.rows
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching leads:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch leads' 
    });
  }
}