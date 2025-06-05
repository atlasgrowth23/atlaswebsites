import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

// Professional analytics dashboard API
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { state = 'Alabama' } = req.query;

    // Get companies for the state
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('id, name, slug, city, state')
      .eq('state', state)
      .order('name');

    if (companiesError) {
      console.error('Companies query error:', companiesError);
      throw companiesError;
    }

    // Also get all companies that have tracking data regardless of state
    const { data: allTrackingCompanies, error: trackingError } = await supabaseAdmin
      .from('template_views')
      .select('company_id')
      .not('company_id', 'is', null);

    if (trackingError) {
      console.error('Tracking companies query error:', trackingError);
    }

    // Get unique company IDs from tracking data
    const trackingCompanyIds = Array.from(new Set(allTrackingCompanies?.map(t => t.company_id) || []));
    
    // Get company details for tracking companies not in the state filter
    const { data: additionalCompanies, error: additionalError } = await supabaseAdmin
      .from('companies')
      .select('id, name, slug, city, state')
      .in('id', trackingCompanyIds)
      .not('state', 'eq', state);

    if (additionalError) {
      console.error('Additional companies query error:', additionalError);
    }

    // Combine all companies
    const allCompanies = [...(companies || []), ...(additionalCompanies || [])];
    
    if (allCompanies.length === 0) {
      return res.status(200).json({
        summary: { totalViews: 0, totalSessions: 0, avgTime: 0, activeCompanies: 0 },
        companies: []
      });
    }

    const companyIds = allCompanies.map(c => c.id);

    // Get analytics data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: analytics, error: analyticsError } = await supabaseAdmin
      .from('template_views')
      .select('company_id, session_id, total_time_seconds, device_type, created_at')
      .in('company_id', companyIds)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (analyticsError) {
      console.error('Analytics query error:', analyticsError);
      throw analyticsError;
    }

    // Process analytics data
    const companyStats = allCompanies.map(company => {
      const companyViews = analytics?.filter(v => v.company_id === company.id) || [];
      const sessions = new Set(companyViews.map(v => v.session_id));
      const totalViews = companyViews.length;
      const totalSessions = sessions.size;
      
      // Calculate average time (only for sessions with meaningful time)
      const validTimes = companyViews
        .map(v => v.total_time_seconds || 0)
        .filter(time => time > 0);
      const avgTime = validTimes.length > 0 
        ? Math.round(validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length)
        : 0;

      // Get last activity
      const lastView = companyViews.length > 0 
        ? Math.max(...companyViews.map(v => new Date(v.created_at).getTime()))
        : null;

      // Device breakdown
      const deviceBreakdown = {
        desktop: companyViews.filter(v => v.device_type === 'desktop').length,
        mobile: companyViews.filter(v => v.device_type === 'mobile').length,
        tablet: companyViews.filter(v => v.device_type === 'tablet').length
      };

      return {
        company,
        metrics: {
          views: totalViews,
          sessions: totalSessions,
          avgTime,
          lastActivity: lastView ? new Date(lastView).toISOString() : null,
          deviceBreakdown
        }
      };
    });

    // Calculate summary statistics
    const summary = {
      totalViews: companyStats.reduce((sum, stat) => sum + stat.metrics.views, 0),
      totalSessions: companyStats.reduce((sum, stat) => sum + stat.metrics.sessions, 0),
      avgTime: companyStats.length > 0 
        ? Math.round(companyStats.reduce((sum, stat) => sum + stat.metrics.avgTime, 0) / companyStats.length)
        : 0,
      activeCompanies: companyStats.filter(stat => stat.metrics.views > 0).length
    };

    res.status(200).json({
      summary,
      companies: companyStats,
      timeframe: '30 days',
      state
    });

  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analytics dashboard',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}