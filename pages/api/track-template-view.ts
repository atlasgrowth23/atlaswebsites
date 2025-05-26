import { NextApiRequest, NextApiResponse } from 'next';
import { query, queryOne } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { companySlug, templateKey, companyId } = req.body;
    
    // Check if tracking is enabled for this company
    const trackingStatus = await queryOne(`
      SELECT tracking_enabled FROM prospect_tracking WHERE company_id = $1
    `, [companyId]);
    
    if (trackingStatus && trackingStatus.tracking_enabled) {
      // Update view counts
      await query(`
        UPDATE prospect_tracking 
        SET 
          total_views = total_views + 1,
          template_views = template_views || jsonb_build_object($2, COALESCE((template_views->>$2)::integer, 0) + 1),
          last_viewed_at = CURRENT_TIMESTAMP
        WHERE company_id = $1
      `, [companyId, templateKey]);
      
      console.log('Template view tracked:', { companySlug, templateKey, companyId });
    } else {
      console.log('View not tracked - tracking disabled for company:', companySlug);
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error tracking template view:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}