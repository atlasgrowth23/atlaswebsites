import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

interface PageView {
  id: string;
  company_id: string;
  page_url: string;
  referrer: string;
  device_type: string;
  user_agent: string;
  viewed_at: string;
}

interface Visit {
  id: string;
  time_on_site: number; // in seconds
  device_type: string;
  device_model: string;
  visit_time: string;
  referrer: string;
  is_return_visitor: boolean;
  visitor_id: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    // Get last 30 days of template views (real tracking data)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: views, error } = await supabaseAdmin
      .from('template_views')
      .select('id, session_id, total_time_seconds, device_type, visit_start_time, referrer_url, created_at')
      .eq('company_id', companyId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching template views:', error);
      return res.status(500).json({ error: 'Failed to fetch analytics' });
    }

    if (!views || views.length === 0) {
      return res.status(200).json({
        visits: [],
        summary: {
          total_visits: 0,
          avg_time_on_site: 0
        }
      });
    }

    // Convert each template view to a visit with enhanced data
    const visits: Visit[] = views.map((view: any) => ({
      id: `visit_${view.session_id}`,
      time_on_site: view.total_time_seconds || 0,
      device_type: view.device_type || 'desktop',
      device_model: view.device_model || view.device_type || 'Unknown',
      visit_time: view.visit_start_time || view.created_at,
      referrer: view.referrer_url || 'Direct SMS Link',
      is_return_visitor: view.is_return_visitor || false,
      visitor_id: view.visitor_id
    }));

    // Calculate professional stats
    const totalVisits = visits.length;
    const uniqueVisitors = new Set(views.map((v: any) => v.visitor_id).filter(Boolean)).size;
    const returnVisitors = visits.filter(v => v.is_return_visitor).length;
    const bounceRate = visits.length > 0 
      ? Math.round((visits.filter(v => v.time_on_site < 10).length / visits.length) * 100)
      : 0;
    const avgTimeOnSite = visits.length > 0 
      ? Math.round(visits.reduce((sum, v) => sum + v.time_on_site, 0) / visits.length)
      : 0;

    res.status(200).json({
      visits: visits.slice(0, 20), // Limit to 20 most recent visits
      summary: {
        total_visits: totalVisits,
        unique_visitors: uniqueVisitors,
        return_visitors: returnVisitors,
        bounce_rate: bounceRate,
        avg_time_on_site: avgTimeOnSite
      }
    });

  } catch (error) {
    console.error('Visits analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}