import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Test basic database connection
    const { count: testCount, error: testError } = await supabaseAdmin
      .from('companies')
      .select('*', { count: 'exact', head: true });

    if (testError) {
      return res.status(500).json({ 
        error: 'Database connection failed', 
        details: testError.message 
      });
    }

    // Test companies query
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('id, name, slug, city, state')
      .eq('state', 'Alabama')
      .limit(5);

    if (companiesError) {
      return res.status(500).json({ 
        error: 'Companies query failed', 
        details: companiesError.message 
      });
    }

    // Test template_views query
    const { data: views, error: viewsError } = await supabaseAdmin
      .from('template_views')
      .select('company_id, session_id, total_time_seconds')
      .limit(5);

    return res.status(200).json({
      status: 'success',
      companiesCount: companies?.length || 0,
      viewsCount: views?.length || 0,
      companies: companies?.slice(0, 3) || [],
      views: views?.slice(0, 3) || [],
      viewsError: viewsError?.message || null
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}