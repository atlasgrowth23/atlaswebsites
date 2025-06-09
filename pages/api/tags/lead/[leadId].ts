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

    // Get tags with definitions
    const { data: tags, error } = await supabaseAdmin
      .from('lead_tags')
      .select(`
        id,
        tag_type,
        tag_value,
        is_auto_generated,
        created_at,
        created_by,
        metadata,
        tag_definitions!inner(
          display_name,
          color_class,
          description
        )
      `)
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tags:', error);
      return res.status(500).json({ error: 'Failed to fetch tags' });
    }

    return res.status(200).json({ tags: tags || [] });

  } catch (error) {
    console.error('Get tags API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}