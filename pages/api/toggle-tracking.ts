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
    // Update or insert tracking status
    await query(`
      INSERT INTO enhanced_tracking (company_id, tracking_enabled, activated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (company_id)
      DO UPDATE SET 
        tracking_enabled = EXCLUDED.tracking_enabled,
        activated_at = CASE 
          WHEN EXCLUDED.tracking_enabled = true THEN CURRENT_TIMESTAMP
          ELSE enhanced_tracking.activated_at
        END
    `, [businessId, enabled]);

    res.status(200).json({ 
      success: true, 
      message: `Tracking ${enabled ? 'enabled' : 'disabled'}` 
    });
  } catch (error) {
    console.error('Toggle tracking error:', error);
    res.status(500).json({ message: 'Failed to update tracking status' });
  }
}