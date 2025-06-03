import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    // Check if company already exists in pipeline
    const { data: existing } = await supabaseAdmin
      .from('lead_pipeline')
      .select('id')
      .eq('company_id', companyId)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Company already in pipeline' });
    }

    // Add company to pipeline
    const { data: newLead, error } = await supabaseAdmin
      .from('lead_pipeline')
      .insert({
        company_id: companyId,
        stage: 'new_lead',
        notes: ''
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to add lead to pipeline' });
    }

    // Log the action
    await supabaseAdmin
      .from('contact_log')
      .insert({
        company_id: companyId,
        stage_from: null,
        stage_to: 'new_lead',
        notes: 'Added to pipeline',
        created_by: 'admin' // You can enhance this with actual user info
      });

    res.status(201).json({ lead: newLead });
  } catch (error) {
    console.error('Add lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}