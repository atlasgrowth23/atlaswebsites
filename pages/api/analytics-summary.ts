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

    // Get template views for this company with time data
    const { data: views, error } = await supabaseAdmin
      .from('template_views')
      .select('total_time_seconds, user_agent, session_id')
      .eq('company_id', companyId);

    if (error) {
      console.error('Error fetching analytics:', error);
      return res.status(500).json({ error: 'Failed to fetch analytics' });
    }

    // Calculate average time
    const totalTime = views.reduce((sum, view) => sum + (view.total_time_seconds || 0), 0);
    const avgTimeSeconds = views.length > 0 ? Math.round(totalTime / views.length) : 0;

    // Calculate device breakdown from user agents
    const deviceBreakdown = {
      desktop: 0,
      mobile: 0,
      tablet: 0
    };

    views.forEach(view => {
      const userAgent = view.user_agent || '';
      if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
        if (/iPad|Tablet/i.test(userAgent)) {
          deviceBreakdown.tablet++;
        } else {
          deviceBreakdown.mobile++;
        }
      } else {
        deviceBreakdown.desktop++;
      }
    });

    return res.status(200).json({
      avg_time_seconds: avgTimeSeconds,
      device_breakdown: deviceBreakdown,
      total_sessions: new Set(views.map(v => v.session_id)).size
    });

  } catch (error) {
    console.error('Error in analytics-summary:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}