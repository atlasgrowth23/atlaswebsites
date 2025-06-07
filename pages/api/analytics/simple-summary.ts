import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

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

    const totalViews = views?.length || 0;
    
    // Device breakdown
    const deviceCounts = views?.reduce((acc, view) => {
      acc[view.device_type] = (acc[view.device_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Daily views for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentViews = views?.filter(view => 
      new Date(view.viewed_at) >= sevenDaysAgo
    ) || [];

    const dailyViews = recentViews.reduce((acc, view) => {
      const date = new Date(view.viewed_at).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top referrers
    const referrerCounts = views?.reduce((acc, view) => {
      const referrer = view.referrer || 'Direct';
      acc[referrer] = (acc[referrer] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const topReferrers = Object.entries(referrerCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([referrer, count]) => ({ referrer, count }));

    res.status(200).json({
      total_views: totalViews,
      device_breakdown: {
        desktop: deviceCounts.desktop || 0,
        mobile: deviceCounts.mobile || 0,
        tablet: deviceCounts.tablet || 0
      },
      daily_views: dailyViews,
      top_referrers: topReferrers,
      period: 'Last 30 days'
    });

  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}