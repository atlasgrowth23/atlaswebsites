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
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Look up owner name in tk_contacts table by email
    const { data: contact, error } = await supabase
      .from('tk_contacts')
      .select('owner_name, company_id')
      .eq('owner_email', email)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching owner name:', error);
      return res.status(500).json({ error: 'Failed to fetch owner name' });
    }

    if (contact?.owner_name) {
      return res.status(200).json({ 
        owner_name: contact.owner_name,
        company_id: contact.company_id 
      });
    } else {
      return res.status(200).json({ 
        owner_name: null,
        company_id: null 
      });
    }

  } catch (error) {
    console.error('Get owner name API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}