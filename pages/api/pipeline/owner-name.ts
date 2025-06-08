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

      // Get owner name and email for the lead
      const { data: lead, error } = await supabase
        .from('lead_pipeline')
        .select('owner_name, owner_email')
        .eq('id', leadId)
        .single();

      if (error) {
        console.error('Error fetching owner info:', error);
        return res.status(500).json({ error: 'Failed to fetch owner info' });
      }

      res.status(200).json({ 
        owner_name: lead?.owner_name || '',
        owner_email: lead?.owner_email || ''
      });
      
    } else if (req.method === 'POST') {
      const { lead_id, owner_name, owner_email, company_id, email_1 } = req.body;

      // Update owner name and/or email in lead_pipeline table
      if (lead_id && (owner_name !== undefined || owner_email !== undefined)) {
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
          .from('lead_pipeline')
          .update(updateData)
          .eq('id', lead_id)
          .select('*')
          .single();

        if (error) {
          console.error('Error updating owner info:', error);
          return res.status(500).json({ error: 'Failed to update owner info' });
        }

        return res.status(200).json({ 
          success: true, 
          owner_name: data.owner_name,
          owner_email: data.owner_email 
        });
      }

      // Update email_1 in companies table
      if (company_id && email_1 !== undefined) {
        const { data, error } = await supabase
          .from('companies')
          .update({
            email_1: email_1 || null
          })
          .eq('id', company_id)
          .select('email_1')
          .single();

        if (error) {
          console.error('Error updating company email:', error);
          return res.status(500).json({ error: 'Failed to update company email' });
        }

        return res.status(200).json({ success: true, email_1: data.email_1 });
      }

      return res.status(400).json({ error: 'Invalid request parameters' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}