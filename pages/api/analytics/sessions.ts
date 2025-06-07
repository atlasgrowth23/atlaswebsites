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

interface Session {
  id: string;
  duration: number; // in seconds
  device_type: string;
  pages_visited: number;
  start_time: string;
  end_time: string;
  referrer: string;
  user_agent: string;
  views: PageView[];
}

function groupViewsIntoSessions(views: PageView[]): Session[] {
  // Group views by IP-like identifier (using user_agent + device_type as proxy)
  const userGroups = views.reduce((acc, view) => {
    const userKey = `${view.user_agent}_${view.device_type}`;
    if (!acc[userKey]) acc[userKey] = [];
    acc[userKey].push(view);
    return acc;
  }, {} as Record<string, PageView[]>);

  const sessions: Session[] = [];

  Object.values(userGroups).forEach(userViews => {
    // Sort views by time
    userViews.sort((a, b) => new Date(a.viewed_at).getTime() - new Date(b.viewed_at).getTime());
    
    let currentSession: PageView[] = [];
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

    userViews.forEach((view, index) => {
      if (currentSession.length === 0) {
        currentSession = [view];
      } else {
        const lastViewTime = new Date(currentSession[currentSession.length - 1].viewed_at).getTime();
        const currentViewTime = new Date(view.viewed_at).getTime();
        
        // If more than 30 minutes since last view, start new session
        if (currentViewTime - lastViewTime > SESSION_TIMEOUT) {
          // Complete current session
          if (currentSession.length > 0) {
            sessions.push(createSessionFromViews(currentSession));
          }
          currentSession = [view];
        } else {
          currentSession.push(view);
        }
      }
      
      // If this is the last view, complete the session
      if (index === userViews.length - 1 && currentSession.length > 0) {
        sessions.push(createSessionFromViews(currentSession));
      }
    });
  });

  return sessions.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
}

function createSessionFromViews(views: PageView[]): Session {
  const startTime = new Date(views[0].viewed_at);
  const endTime = new Date(views[views.length - 1].viewed_at);
  const duration = Math.max(1, Math.floor((endTime.getTime() - startTime.getTime()) / 1000));
  
  return {
    id: `session_${startTime.getTime()}_${views[0].user_agent?.slice(-8) || 'unknown'}`,
    duration,
    device_type: views[0].device_type,
    pages_visited: views.length,
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    referrer: views[0].referrer || 'Direct',
    user_agent: views[0].user_agent,
    views
  };
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
        sessions: [],
        summary: {
          total_sessions: 0,
          total_page_views: 0,
          avg_session_duration: 0,
          device_breakdown: { desktop: 0, mobile: 0, tablet: 0 }
        }
      });
    }

    const sessions = groupViewsIntoSessions(views);
    
    // Calculate summary stats
    const totalSessions = sessions.length;
    const totalPageViews = views.length;
    const avgSessionDuration = sessions.length > 0 
      ? Math.round(sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length)
      : 0;
    
    const deviceBreakdown = sessions.reduce((acc, session) => {
      acc[session.device_type] = (acc[session.device_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.status(200).json({
      sessions: sessions.slice(0, 20), // Limit to 20 most recent sessions
      summary: {
        total_sessions: totalSessions,
        total_page_views: totalPageViews,
        avg_session_duration: avgSessionDuration,
        device_breakdown: {
          desktop: deviceBreakdown.desktop || 0,
          mobile: deviceBreakdown.mobile || 0,
          tablet: deviceBreakdown.tablet || 0
        }
      }
    });

  } catch (error) {
    console.error('Sessions analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}