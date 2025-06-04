import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get companies from Alabama and Arkansas WITHOUT existing websites
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('*')
      .in('state', ['Alabama', 'Arkansas'])
      .or('site.is.null,site.eq.')  // Only companies with no website (null or empty)
      .order('name');

    if (companiesError) {
      console.error('Companies error:', companiesError);
      return res.status(500).json({ error: 'Failed to fetch companies' });
    }

    // Get existing pipeline entries
    const { data: pipelineEntries, error: pipelineError } = await supabaseAdmin
      .from('lead_pipeline')
      .select('*')
      .order('updated_at', { ascending: false });

    if (pipelineError) {
      console.error('Pipeline error:', pipelineError);
      return res.status(500).json({ error: 'Failed to fetch pipeline data' });
    }

    // Create a map of pipeline entries by company_id
    const pipelineMap = new Map();
    pipelineEntries?.forEach(entry => {
      pipelineMap.set(entry.company_id, entry);
    });

    // Create leads array - all companies are leads, defaulting to 'new_lead' stage
    const leads = companies?.map(company => {
      const pipelineEntry = pipelineMap.get(company.id);
      
      return {
        id: pipelineEntry?.id || `temp_${company.id}`,
        company_id: company.id,
        stage: pipelineEntry?.stage || 'new_lead',
        last_contact_date: pipelineEntry?.last_contact_date || null,
        next_follow_up_date: pipelineEntry?.next_follow_up_date || null,
        notes: pipelineEntry?.notes || '',
        created_at: pipelineEntry?.created_at || company.created_at,
        updated_at: pipelineEntry?.updated_at || company.created_at,
        company: {
          id: company.id,
          name: company.name,
          slug: company.slug,
          city: company.city,
          state: company.state,
          phone: company.phone,
          email_1: company.email_1,
          site: company.site,
          tracking_enabled: company.tracking_enabled,
          rating: company.rating,
          reviews: company.reviews,
          reviews_link: company.reviews_link,
          first_review_date: company.first_review_date,
          r_30: company.r_30,
          r_60: company.r_60,
          r_90: company.r_90,
          r_365: company.r_365,
          predicted_label: company.predicted_label
        }
      };
    }) || [];

    res.status(200).json({ leads });
  } catch (error) {
    console.error('Pipeline leads error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}