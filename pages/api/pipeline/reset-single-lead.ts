import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { leadId } = req.body;
    
    if (!leadId) {
      return res.status(400).json({ error: 'Lead ID required' });
    }

    // Get lead info
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('lead_pipeline')
      .select('company_id, companies(name)')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Clear all related data
    await Promise.all([
      supabaseAdmin.from('activity_log').delete().eq('lead_id', leadId),
      supabaseAdmin.from('lead_tags').delete().eq('lead_id', leadId),
      supabaseAdmin.from('appointments').delete().eq('lead_id', leadId),
      supabaseAdmin.from('template_views').delete().eq('company_id', lead.company_id)
    ]);

    // Reset lead to new_lead stage
    const { error: resetError } = await supabaseAdmin
      .from('lead_pipeline')
      .update({
        stage: 'new_lead',
        notes: '',
        last_contact_date: null,
        next_follow_up_date: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId);

    if (resetError) {
      return res.status(500).json({ error: 'Failed to reset lead' });
    }

    return res.status(200).json({
      success: true,
      message: `${lead.companies?.name} reset to new_lead stage`
    });

  } catch (error) {
    console.error('Single lead reset error:', error);
    return res.status(500).json({ error: 'Failed to reset lead' });
  }
}