import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user } = req.query;

    // Get sessions for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let query = supabaseAdmin
      .from('cold_call_sessions')
      .select('*')
      .gte('start_time', thirtyDaysAgo.toISOString())
      .order('start_time', { ascending: false });

    // Filter by user if specified
    if (user && typeof user === 'string') {
      query = query.eq('user_name', user);
    }

    const { data: sessions, error } = await query.limit(100);

    if (error) {
      console.error('Error fetching sessions:', error);
      return res.status(500).json({ error: 'Failed to fetch sessions' });
    }

    return res.status(200).json({ sessions: sessions || [] });

  } catch (error) {
    console.error('Sessions API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}