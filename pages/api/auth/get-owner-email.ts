import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { companyId } = req.query;

    if (!companyId || typeof companyId !== 'string') {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    // Look up owner email in tk_contacts table by company_id
    const { data: contact, error } = await supabase
      .from('tk_contacts')
      .select('owner_email, owner_name')
      .eq('company_id', companyId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching owner email:', error);
      return res.status(500).json({ error: 'Failed to fetch owner email' });
    }

    if (contact?.owner_email) {
      return res.status(200).json({ 
        owner_email: contact.owner_email,
        owner_name: contact.owner_name 
      });
    } else {
      return res.status(200).json({ 
        owner_email: null,
        owner_name: null 
      });
    }

  } catch (error) {
    console.error('Get owner email API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}