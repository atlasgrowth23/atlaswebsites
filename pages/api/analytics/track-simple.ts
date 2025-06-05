import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { companyId, sessionId, timeOnPage = 10 } = req.body;

    // Simple insert with all required fields
    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from('template_views')
      .insert({
        company_id: companyId,
        company_slug: 'test-slug',
        session_id: sessionId,
        total_time_seconds: timeOnPage,
        template_key: 'moderntrust',
        device_type: 'desktop',
        user_agent: 'Test Browser',
        browser_name: 'chrome',
        page_interactions: 1,
        visit_start_time: now,
        visit_end_time: now,
        is_initial_visit: true,
        created_at: now,
        updated_at: now
      });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ success: true, data });

  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}