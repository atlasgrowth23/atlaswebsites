import { NextApiRequest, NextApiResponse } from 'next';
import { query, queryOne } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
      // Activate or deactivate tracking for a company
      const { companyId, action } = req.body;
      
      if (action === 'activate') {
        await query(`
          INSERT INTO prospect_tracking (company_id, tracking_enabled, activated_at)
          VALUES ($1, true, CURRENT_TIMESTAMP)
          ON CONFLICT (company_id) 
          DO UPDATE SET tracking_enabled = true, activated_at = CURRENT_TIMESTAMP
        `, [companyId]);
        
        res.json({ success: true, message: 'Tracking activated' });
      } else if (action === 'deactivate') {
        await query(`
          UPDATE prospect_tracking 
          SET tracking_enabled = false 
          WHERE company_id = $1
        `, [companyId]);
        
        res.json({ success: true, message: 'Tracking deactivated' });
      }
    } else if (req.method === 'GET') {
      // Get tracking data for all companies
      const trackingData = await query(`
        SELECT pt.*, c.name, c.slug 
        FROM prospect_tracking pt
        JOIN companies c ON c.id::text = pt.company_id
        ORDER BY pt.activated_at DESC NULLS LAST
      `);
      
      res.json({ trackingData: trackingData.rows });
    }
  } catch (error) {
    console.error('Tracking API error:', error);
    res.status(500).json({ error: 'Database error' });
  }
}