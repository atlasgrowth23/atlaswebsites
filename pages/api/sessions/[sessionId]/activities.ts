import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId } = req.query;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Get activities for this session with company names
    const { data: activities, error } = await supabaseAdmin
      .from('activity_log')
      .select(`
        id,
        action,
        action_data,
        created_at,
        lead_id,
        companies!activity_log_company_id_fkey(name)
      `)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching session activities:', error);
      return res.status(500).json({ error: 'Failed to fetch activities' });
    }

    // Format activities with company names
    const formattedActivities = activities?.map(activity => ({
      id: activity.id,
      action: activity.action,
      action_data: activity.action_data,
      created_at: activity.created_at,
      lead_id: activity.lead_id,
      company_name: activity.companies?.name || 'Unknown Company'
    })) || [];

    return res.status(200).json({ activities: formattedActivities });

  } catch (error) {
    console.error('Session activities API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}