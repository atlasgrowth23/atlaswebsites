import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { leadId } = req.query;

  if (!leadId || typeof leadId !== 'string') {
    return res.status(400).json({ error: 'Invalid lead ID' });
  }

  try {
    if (req.method === 'GET') {
      // Get activity timeline for the lead
      const { data: activities, error } = await supabase
        .from('lead_activity')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(50); // Limit to last 50 activities

      if (error) {
        console.error('Error fetching activities:', error);
        return res.status(500).json({ error: 'Failed to fetch activities' });
      }

      res.status(200).json(activities || []);
    } else if (req.method === 'POST') {
      // Add new activity
      const { activity_type, description, metadata = {} } = req.body;

      if (!activity_type || !description) {
        return res.status(400).json({ error: 'Activity type and description are required' });
      }

      // Validate activity type
      const validTypes = ['call', 'email', 'sms', 'stage_move', 'note'];
      if (!validTypes.includes(activity_type)) {
        return res.status(400).json({ error: 'Invalid activity type' });
      }

      const { data: activity, error } = await supabase
        .from('lead_activity')
        .insert({
          lead_id: leadId,
          activity_type,
          description,
          metadata
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error creating activity:', error);
        return res.status(500).json({ error: 'Failed to create activity' });
      }

      res.status(201).json(activity);
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}