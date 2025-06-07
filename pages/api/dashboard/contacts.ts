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

    // Get contacts for this company (only those with names)
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('id, name, email, phone, last_interaction, created_at')
      .eq('company_id', companyId)
      .not('name', 'is', null) // Only contacts with names (Option 2 flow)
      .order('last_interaction', { ascending: false });

    if (error) {
      console.error('Error fetching contacts:', error);
      return res.status(500).json({ error: 'Failed to fetch contacts' });
    }

    res.status(200).json({
      success: true,
      contacts: contacts || []
    });

  } catch (error) {
    console.error('Contacts API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}