import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { businessId, enabled } = req.body;

  if (!businessId) {
    return res.status(400).json({ message: 'Business ID required' });
  }

  try {
    console.log('TOGGLE TRACKING REQUEST:', { businessId, enabled });

    // Check if record exists first
    const existing = await query(`
      SELECT id FROM enhanced_tracking WHERE company_id = $1
    `, [businessId]);

    if (existing.rows.length > 0) {
      // Update existing record
      console.log('UPDATING EXISTING TRACKING RECORD');
      await query(`
        UPDATE enhanced_tracking 
        SET tracking_enabled = $2,
            activated_at = CASE 
              WHEN $2 = true THEN CURRENT_TIMESTAMP
              ELSE activated_at
            END
        WHERE company_id = $1
      `, [businessId, enabled]);
    } else {
      // Insert new record
      console.log('INSERTING NEW TRACKING RECORD');
      await query(`
        INSERT INTO enhanced_tracking (company_id, tracking_enabled, activated_at, total_views)
        VALUES ($1, $2, CURRENT_TIMESTAMP, 0)
      `, [businessId, enabled]);
    }

    console.log('TRACKING TOGGLE SUCCESS:', { businessId, enabled });
    res.status(200).json({ 
      success: true, 
      message: `Tracking ${enabled ? 'enabled' : 'disabled'}`,
      businessId,
      enabled
    });
  } catch (error) {
    console.error('Toggle tracking error:', error);
    res.status(500).json({ message: 'Failed to update tracking status', error: error.message });
  }
}