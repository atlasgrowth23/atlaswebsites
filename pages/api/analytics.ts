import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { state } = req.query;
    
    // Get companies for the state
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('id, name, slug, city, state')
      .eq('state', state || 'Alabama');

    if (companiesError) {
      console.error('Companies query error:', companiesError);
      throw companiesError;
    }

    if (!companies || companies.length === 0) {
      console.log('No companies found for state:', state || 'Alabama');
      return res.status(200).json({
        summary: { totalViews: 0, totalSessions: 0, avgTime: 0, activeCompanies: 0 },
        companies: {},
        pipeline: {}
      });
    }

    const companyIds = companies.map(c => c.id);

    // Optimized query with proper ordering and limits
    const { data: analytics, error: analyticsError } = await supabaseAdmin
      .from('template_views')
      .select(`
        company_id,
        session_id,
        total_time_seconds,
        visit_start_time,
        user_agent,
        device_type
      `)
      .in('company_id', companyIds)
      .order('visit_start_time', { ascending: false })
      .limit(5000); // Limit to prevent memory issues

    if (analyticsError) {
      throw analyticsError;
    }

    // Process data by company
    const companyStats: Record<string, any> = {};
    let totalViews = 0;
    let totalSessions = 0;
    let totalTime = 0;

    companies.forEach(company => {
      const companyViews = analytics.filter(v => v.company_id === company.id);
      const sessions = new Set(companyViews.map(v => v.session_id)).size;
      const views = companyViews.length;
      const avgTime = views > 0 ? Math.round(companyViews.reduce((sum, v) => sum + (v.total_time_seconds || 0), 0) / views) : 0;
      const lastView = views > 0 ? Math.max(...companyViews.map(v => new Date(v.visit_start_time).getTime())) : null;
      
      // Device breakdown
      const devices = { desktop: 0, mobile: 0, tablet: 0 };
      companyViews.forEach(v => {
        if (v.device_type === 'mobile') devices.mobile++;
        else if (v.device_type === 'tablet') devices.tablet++;
        else devices.desktop++;
      });

      companyStats[company.id] = {
        company,
        views,
        sessions,
        avgTime,
        lastView: lastView ? new Date(lastView).toISOString() : null,
        devices
      };

      totalViews += views;
      totalSessions += sessions;
      totalTime += avgTime;
    });

    // Get pipeline stats
    const { data: pipeline } = await supabaseAdmin
      .from('lead_pipeline')
      .select('company_id, stage')
      .in('company_id', companyIds);

    const pipelineStats: Record<string, any> = {};
    (pipeline || []).forEach((p: any) => {
      pipelineStats[p.company_id] = p.stage;
    });

    // Return everything in one response
    res.status(200).json({
      summary: {
        totalViews,
        totalSessions,
        avgTime: companies.length > 0 ? Math.round(totalTime / companies.length) : 0,
        activeCompanies: Object.values(companyStats).filter((s: any) => s.views > 0).length
      },
      companies: companyStats,
      pipeline: pipelineStats
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
}