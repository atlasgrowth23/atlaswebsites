import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Test companies query
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('id, name, slug')
      .eq('state', 'Alabama')
      .limit(3);

    if (companiesError) {
      return res.status(500).json({ error: companiesError.message });
    }

    // Test analytics query
    const { data: analytics, error: analyticsError } = await supabaseAdmin
      .from('template_views')
      .select('*')
      .limit(5);

    if (analyticsError) {
      return res.status(500).json({ error: analyticsError.message });
    }

    res.status(200).json({
      companies,
      analytics,
      companiesCount: companies?.length || 0,
      analyticsCount: analytics?.length || 0
    });

  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}