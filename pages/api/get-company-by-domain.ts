import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { domain } = req.query;
  console.log('🔍 Looking up domain:', domain);

  if (!domain || typeof domain !== 'string') {
    return res.status(400).json({ message: 'Domain parameter required' });
  }

  try {
    console.log('Querying companies table for custom_domain:', domain);
    
    // Find company with this custom domain using Supabase
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name, slug, custom_domain')
      .eq('custom_domain', domain);

    console.log('Query result:', { companies, error });

    if (error) {
      console.error('Database query error:', error);
      throw error;
    }

    if (!companies || companies.length === 0) {
      console.log('No companies found for domain:', domain);
      return res.status(404).json({ message: 'No company found for this domain' });
    }

    const company = companies[0];
    console.log('Found company:', company);
    res.status(200).json(company);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}