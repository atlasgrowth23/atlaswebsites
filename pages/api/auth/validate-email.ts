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
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Validate email exists in tk_contacts table
    const { data: contact, error } = await supabase
      .from('tk_contacts')
      .select('owner_email, owner_name, company_id')
      .eq('owner_email', email)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error validating email:', error);
      return res.status(500).json({ error: 'Failed to validate email' });
    }

    if (contact) {
      return res.status(200).json({ 
        valid: true,
        message: 'Email validated successfully',
        owner_name: contact.owner_name,
        company_id: contact.company_id
      });
    } else {
      return res.status(404).json({ 
        valid: false,
        message: 'Email not found in our records. Please contact support at support@atlasgrowth.ai'
      });
    }

  } catch (error) {
    console.error('Validate email API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}