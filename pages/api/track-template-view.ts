import { NextApiRequest, NextApiResponse } from 'next';
import { query, queryOne } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { companySlug, templateKey, companyId, sessionId, timeOnPage, userAgent, referrer } = req.body;
    
    // Check if tracking is enabled for this company
    const trackingStatus = await queryOne(`
      SELECT tracking_enabled FROM enhanced_tracking WHERE company_id = $1
    `, [companyId]);
    
    if (trackingStatus && trackingStatus.tracking_enabled) {
      // Insert detailed visit record for sessions
      if (sessionId) {
        await query(`
          INSERT INTO enhanced_tracking (
            company_id, 
            session_id, 
            template_key,
            total_time_seconds,
            user_agent,
            referrer_url,
            visit_start_time,
            visit_end_time,
            last_viewed_at
          ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [companyId, sessionId, templateKey, timeOnPage || 0, userAgent || '', referrer || '']);
      }
      
      // Update main tracking record
      await query(`
        UPDATE enhanced_tracking 
        SET 
          total_views = total_views + 1,
          last_viewed_at = CURRENT_TIMESTAMP
        WHERE company_id = $1 AND session_id IS NULL
      `, [companyId]);
      
      console.log('Template view tracked:', { companySlug, templateKey, companyId, timeOnPage });
    } else {
      console.log('View not tracked - tracking disabled for company:', companySlug);
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error tracking template view:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}