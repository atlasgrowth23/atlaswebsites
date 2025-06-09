import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { leadId, tagType, createdBy = 'system', metadata = {} } = req.body;

    if (!leadId || !tagType) {
      return res.status(400).json({ error: 'leadId and tagType are required' });
    }

    // Check if tag already exists
    const { data: existingTag } = await supabaseAdmin
      .from('lead_tags')
      .select('id')
      .eq('lead_id', leadId)
      .eq('tag_type', tagType)
      .single();

    if (existingTag) {
      return res.status(200).json({ 
        success: true, 
        message: 'Tag already exists',
        tagId: existingTag.id 
      });
    }

    // Get tag definition
    const { data: tagDef } = await supabaseAdmin
      .from('tag_definitions')
      .select('*')
      .eq('tag_type', tagType)
      .single();

    if (!tagDef) {
      return res.status(400).json({ error: 'Invalid tag type' });
    }

    // Add tag
    const { data: newTag, error } = await supabaseAdmin
      .from('lead_tags')
      .insert([{
        lead_id: leadId,
        tag_type: tagType,
        tag_value: tagType, // Same as type for now
        is_auto_generated: tagDef.is_auto_tag,
        created_by: createdBy,
        metadata
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding tag:', error);
      return res.status(500).json({ error: 'Failed to add tag' });
    }

    // Get company_id for activity logging
    const { data: leadInfo } = await supabaseAdmin
      .from('lead_pipeline')
      .select('company_id')
      .eq('id', leadId)
      .single();

    // Log tag addition to activity log
    if (leadInfo) {
      await supabaseAdmin
        .from('activity_log')
        .insert({
          lead_id: leadId,
          company_id: leadInfo.company_id,
          user_name: createdBy,
          action: 'tag_added',
          action_data: {
            tag_type: tagType,
            tag_display_name: tagDef.display_name,
            is_auto_generated: tagDef.is_auto_tag,
            metadata
          }
        });
    }

    return res.status(200).json({
      success: true,
      tag: newTag,
      definition: tagDef
    });

  } catch (error) {
    console.error('Add tag API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}