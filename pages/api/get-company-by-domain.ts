import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { domain } = req.query;

  if (!domain || typeof domain !== 'string') {
    return res.status(400).json({ message: 'Domain parameter required' });
  }

  try {
    // Find company with this custom domain using Supabase
    const { data: company, error } = await supabase
      .from('companies')
      .select('id, name, slug, custom_domain')
      .eq('custom_domain', domain)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return res.status(404).json({ message: 'No company found for this domain' });
      }
      throw error;
    }

    res.status(200).json(company);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}