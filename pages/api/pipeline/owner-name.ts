import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { leadId } = req.query;

      if (!leadId || typeof leadId !== 'string') {
        return res.status(400).json({ error: 'Invalid lead ID' });
      }

      // Get owner name and email from companies table via lead's company_id
      const { data: lead, error: leadError } = await supabase
        .from('lead_pipeline')
        .select('company_id')
        .eq('id', leadId)
        .single();

      if (leadError) {
        console.error('Error fetching lead:', leadError);
        return res.status(500).json({ error: 'Failed to fetch lead' });
      }

      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('owner_name, owner_email')
        .eq('id', lead.company_id)
        .single();

      if (companyError) {
        console.error('Error fetching company owner info:', companyError);
        return res.status(500).json({ error: 'Failed to fetch owner info' });
      }

      res.status(200).json({ 
        owner_name: company?.owner_name || '',
        owner_email: company?.owner_email || ''
      });
      
    } else if (req.method === 'POST') {
      const { lead_id, owner_name, owner_email } = req.body;

      if (!lead_id) {
        return res.status(400).json({ error: 'Lead ID is required' });
      }

      // Get the company_id from the lead
      const { data: lead, error: leadError } = await supabase
        .from('lead_pipeline')
        .select('company_id')
        .eq('id', lead_id)
        .single();

      if (leadError) {
        console.error('Error fetching lead:', leadError);
        return res.status(500).json({ error: 'Failed to fetch lead' });
      }

      // Update owner info in companies table
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (owner_name !== undefined) {
        updateData.owner_name = owner_name || null;
      }

      if (owner_email !== undefined) {
        updateData.owner_email = owner_email || null;
      }

      const { data, error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', lead.company_id)
        .select('owner_name, owner_email')
        .single();

      if (error) {
        console.error('Error updating owner info in companies:', error);
        return res.status(500).json({ error: 'Failed to update owner info' });
      }

      console.log(`✅ Updated owner info in companies table: ${data.owner_name} / ${data.owner_email}`);

      return res.status(200).json({ 
        success: true, 
        owner_name: data.owner_name,
        owner_email: data.owner_email 
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}