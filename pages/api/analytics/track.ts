import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

// Working analytics tracking (based on track-simple)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      companyId, 
      companySlug, 
      templateKey,
      sessionId, 
      timeOnPage = 1,
      userAgent = 'Unknown Browser',
      referrer,
      viewport,
      timestamp
    } = req.body;

    // Validate required fields
    if (!companyId || !sessionId) {
      return res.status(400).json({ error: 'Missing companyId or sessionId' });
    }

    // Simple device detection
    const deviceType = userAgent && userAgent.toLowerCase().includes('mobile') ? 'mobile' : 'desktop';
    const browserName = userAgent && userAgent.toLowerCase().includes('chrome') ? 'chrome' : 'other';

    // Insert analytics record (using actual data from tracking script)
    const now = timestamp || new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from('template_views')
      .insert({
        company_id: companyId,
        company_slug: companySlug || 'tracked-company',
        session_id: sessionId,
        total_time_seconds: timeOnPage,
        template_key: templateKey || 'moderntrust',
        device_type: deviceType,
        user_agent: userAgent,
        browser_name: browserName,
        page_interactions: 1,
        visit_start_time: now,
        visit_end_time: now,
        is_initial_visit: true,
        created_at: now,
        updated_at: now
      });

    if (error) {
      console.error('Analytics tracking error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ 
      success: true, 
      timeRecorded: timeOnPage,
      sessionId 
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}