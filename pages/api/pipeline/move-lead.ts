import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { leadId: originalLeadId, stage, notes = '' } = req.body;

    if (!originalLeadId || !stage) {
      return res.status(400).json({ error: 'Lead ID and stage are required' });
    }

    // Handle temp IDs (companies not yet in pipeline table)
    let actualLeadId = originalLeadId;
    let companyId = originalLeadId;
    let currentStage = 'new_lead';
    
    if (originalLeadId.startsWith('temp_')) {
      companyId = originalLeadId.replace('temp_', '');
      
      // Create pipeline entry if it doesn't exist
      const { data: newEntry, error: insertError } = await supabaseAdmin
        .from('lead_pipeline')
        .insert({
          company_id: companyId,
          stage: 'new_lead',
          notes: ''
        })
        .select()
        .single();
        
      if (insertError) {
        console.error('Insert error:', insertError);
        return res.status(500).json({ error: 'Failed to create pipeline entry' });
      }
      
      actualLeadId = newEntry.id;
    } else {
      // Get existing lead data
      const { data: currentLead } = await supabaseAdmin
        .from('lead_pipeline')
        .select('stage, company_id')
        .eq('id', originalLeadId)
        .single();

      if (!currentLead) {
        return res.status(404).json({ error: 'Lead not found' });
      }
      
      companyId = currentLead.company_id;
      currentStage = currentLead.stage;
    }

    // Update lead stage
    const updateData: any = {
      stage,
      last_contact_date: new Date().toISOString()
    };

    if (notes) {
      updateData.notes = notes;
    }

    // Set follow-up date for certain stages
    if (stage === 'follow_up') {
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + 7); // 1 week follow-up
      updateData.next_follow_up_date = followUpDate.toISOString();
    }

    const { data: updatedLead, error } = await supabaseAdmin
      .from('lead_pipeline')
      .update(updateData)
      .eq('id', actualLeadId)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to update lead stage' });
    }

    // Log the stage change
    await supabaseAdmin
      .from('contact_log')
      .insert({
        company_id: companyId,
        stage_from: currentStage,
        stage_to: stage,
        notes: notes || `Moved to ${stage}`,
        created_by: 'admin'
      });

    // Auto-enable tracking when moved to 'contacted' stage
    if (stage === 'contacted') {
      await supabaseAdmin
        .from('companies')
        .update({ 
          tracking_enabled: true,
          tracking_paused: false
        })
        .eq('id', companyId);
    }

    res.status(200).json({ lead: updatedLead });
  } catch (error) {
    console.error('Move lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}