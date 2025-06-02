import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    // Get template views for this company with more details
    const { data: views, error } = await supabaseAdmin
      .from('template_views')
      .select('*')
      .eq('company_id', companyId)
      .order('visit_start_time', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching template views:', error);
      return res.status(500).json({ error: 'Failed to fetch template views' });
    }

    // Calculate statistics
    const totalViews = views.length;
    const uniqueSessions = new Set(views.map(v => v.session_id)).size;
    const lastViewedAt = views.length > 0 ? 
      Math.max(...views.map(v => new Date(v.visit_start_time).getTime())) : null;

    return res.status(200).json({
      total_views: totalViews,
      unique_sessions: uniqueSessions,
      last_viewed_at: lastViewedAt ? new Date(lastViewedAt).toISOString() : null,
      views: views
    });

  } catch (error) {
    console.error('Error in template-views:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}