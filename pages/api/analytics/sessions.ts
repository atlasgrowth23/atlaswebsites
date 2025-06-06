import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { companyId } = req.query;

    if (!companyId || typeof companyId !== 'string') {
      return res.status(400).json({ error: 'Invalid company ID' });
    }

    // Get recent website sessions for this company
    const { data: sessions, error } = await supabaseAdmin
      .from('template_views')
      .select(`
        id,
        session_id,
        total_time_seconds,
        device_type,
        browser_name,
        page_interactions,
        visit_start_time,
        visit_end_time,
        created_at,
        ip_address
      `)
      .eq('company_id', companyId)
      .eq('is_initial_visit', true) // Only initial visits (sessions)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching sessions:', error);
      return res.status(500).json({ error: 'Failed to fetch sessions' });
    }

    // Process sessions to group by session_id and calculate proper metrics
    const processedSessions = sessions?.map(session => ({
      ...session,
      // Ensure we have valid time data
      total_time_seconds: Math.max(session.total_time_seconds || 0, 1),
      // Anonymize IP for privacy
      ip_address: session.ip_address ? 
        session.ip_address.split('.').slice(0, 2).join('.') + '.x.x' : 
        'Unknown'
    })) || [];

    res.status(200).json(processedSessions);

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}