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
  visit_time: string;
  referrer: string;
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

    // Get last 30 days of page views
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: views, error } = await supabaseAdmin
      .from('page_views')
      .select('*')
      .eq('company_id', companyId)
      .gte('viewed_at', thirtyDaysAgo.toISOString())
      .order('viewed_at', { ascending: false });

    if (error) {
      console.error('Error fetching page views:', error);
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

    // Convert each page view to a visit (no grouping needed)
    const visits: Visit[] = views.map((view, index) => ({
      id: `visit_${view.id}`,
      time_on_site: 60, // Default 1 minute - will be replaced with actual tracking data later
      device_type: view.device_type,
      visit_time: view.viewed_at,
      referrer: view.referrer || 'Direct'
    }));

    // Calculate summary stats
    const totalVisits = visits.length;
    const avgTimeOnSite = visits.length > 0 
      ? Math.round(visits.reduce((sum, v) => sum + v.time_on_site, 0) / visits.length)
      : 0;

    res.status(200).json({
      visits: visits.slice(0, 20), // Limit to 20 most recent visits
      summary: {
        total_visits: totalVisits,
        avg_time_on_site: avgTimeOnSite
      }
    });

  } catch (error) {
    console.error('Visits analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}