import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { companyId, event } = req.body;

    if (!companyId || event !== 'website_visit') {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    // Check if company is in pipeline and in "contacted" stage
    const { data: pipelineLead, error: pipelineError } = await supabaseAdmin
      .from('lead_pipeline')
      .select('id, stage')
      .eq('company_id', companyId)
      .single();

    if (pipelineError || !pipelineLead) {
      // Company not in pipeline, ignore
      return res.status(200).json({ message: 'Company not in pipeline' });
    }

    // Only auto-move if they're in "contacted" stage
    if (pipelineLead.stage === 'contacted') {
      // Update to "website_viewed" stage
      const { error: updateError } = await supabaseAdmin
        .from('lead_pipeline')
        .update({
          stage: 'website_viewed',
          last_contact_date: new Date().toISOString()
        })
        .eq('id', pipelineLead.id);

      if (updateError) {
        console.error('Error updating pipeline stage:', updateError);
        return res.status(500).json({ error: 'Failed to update stage' });
      }

      // Log the automatic stage change
      await supabaseAdmin
        .from('contact_log')
        .insert({
          company_id: companyId,
          stage_from: 'contacted',
          stage_to: 'website_viewed',
          notes: 'Auto-moved: First website visit detected',
          created_by: 'system'
        });

      console.log(`Auto-moved company ${companyId} to website_viewed stage`);
      return res.status(200).json({ 
        message: 'Stage updated to website_viewed',
        previousStage: 'contacted',
        newStage: 'website_viewed'
      });
    }

    return res.status(200).json({ 
      message: 'No stage change needed',
      currentStage: pipelineLead.stage
    });

  } catch (error) {
    console.error('Auto stage update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}