import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { leadId } = req.query;

    if (!leadId || typeof leadId !== 'string') {
      return res.status(400).json({ error: 'Lead ID is required' });
    }

    // Get activities for this lead
    const { data: activities, error } = await supabaseAdmin
      .from('activity_log')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching lead activities:', error);
      return res.status(500).json({ error: 'Failed to fetch activities' });
    }

    return res.status(200).json({ activities: activities || [] });

  } catch (error) {
    console.error('Lead activities API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}