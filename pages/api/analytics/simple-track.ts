import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { company_id, page_url, referrer, user_agent } = req.body;

    if (!company_id) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    // Simple device detection
    const isMobile = /Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(user_agent || '');
    const isTablet = /iPad|Tablet/i.test(user_agent || '');
    
    let device_type = 'desktop';
    if (isTablet) device_type = 'tablet';
    else if (isMobile) device_type = 'mobile';

    // Insert simple page view
    const { error } = await supabaseAdmin
      .from('page_views')
      .insert({
        company_id,
        page_url: page_url || '/',
        referrer: referrer || '',
        device_type,
        user_agent: user_agent || '',
        viewed_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error tracking page view:', error);
      return res.status(500).json({ error: 'Failed to track view' });
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Analytics tracking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}