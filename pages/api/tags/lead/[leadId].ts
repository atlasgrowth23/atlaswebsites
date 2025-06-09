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

    // Get tags directly without join
    const { data: tags, error } = await supabaseAdmin
      .from('lead_tags')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    // Get tag definitions separately
    const { data: tagDefs } = await supabaseAdmin
      .from('tag_definitions')
      .select('*');

    const tagDefMap = new Map();
    tagDefs?.forEach(def => {
      tagDefMap.set(def.tag_type, def);
    });

    // Combine tags with definitions
    const flattenedTags = tags?.map(tag => {
      const def = tagDefMap.get(tag.tag_type);
      return {
        id: tag.id,
        tag_type: tag.tag_type,
        tag_value: tag.tag_value,
        is_auto_generated: tag.is_auto_generated,
        created_at: tag.created_at,
        created_by: tag.created_by,
        metadata: tag.metadata,
        display_name: def?.display_name || tag.tag_type,
        color: 'blue',
        description: def?.description || ''
      };
    }) || [];

    if (error) {
      console.error('Error fetching tags:', error);
      return res.status(500).json({ error: 'Failed to fetch tags' });
    }

    return res.status(200).json({ tags: flattenedTags });

  } catch (error) {
    console.error('Get tags API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}