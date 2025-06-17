import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lead_id, tag_types } = req.body;

    if (!lead_id || !tag_types || !Array.isArray(tag_types)) {
      return res.status(400).json({ error: 'lead_id and tag_types array required' });
    }

    // First, ensure tag definitions exist
    const tagDefinitions = [
      { tag_type: 'website_sent', display_name: 'Website Sent', color: '#8B5CF6' },
      { tag_type: 'follow_up_needed', display_name: 'Follow-up Needed', color: '#F59E0B' },
      { tag_type: 'meeting_scheduled', display_name: 'Meeting Scheduled', color: '#10B981' },
      { tag_type: 'not_interested', display_name: 'Not Interested', color: '#6B7280' }
    ];

    // Ensure tag definitions exist
    for (const tagDef of tagDefinitions) {
      if (tag_types.includes(tagDef.tag_type)) {
        await supabase
          .from('tag_definitions')
          .upsert(
            {
              tag_type: tagDef.tag_type,
              display_name: tagDef.display_name,
              color: tagDef.color,
              is_auto_tag: false,
              description: `Call outcome: ${tagDef.display_name}`
            },
            { onConflict: 'tag_type' }
          );
      }
    }

    // Add tags to lead_pipeline
    const tagsToAdd = tag_types.map((tag_type: string) => ({
      lead_id,
      tag_type,
      created_at: new Date().toISOString()
    }));

    // Remove existing tags of these types for this lead first
    await supabase
      .from('lead_tags')
      .delete()
      .eq('lead_id', lead_id)
      .in('tag_type', tag_types);

    // Add new tags
    const { data, error } = await supabase
      .from('lead_tags')
      .insert(tagsToAdd);

    if (error) {
      console.error('Error adding tags:', error);
      return res.status(500).json({ error: 'Failed to add tags' });
    }

    return res.status(200).json({ 
      success: true, 
      message: `Added ${tag_types.length} tags to lead`,
      tags: tagsToAdd
    });

  } catch (error) {
    console.error('Error in add-tags:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}