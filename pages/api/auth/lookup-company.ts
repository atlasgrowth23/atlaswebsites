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
    const { slug, custom_domain, email } = req.query;

    let query = supabase
      .from('companies')
      .select('id, name, email_1, logo_storage_path, predicted_label, slug, custom_domain');

    // Priority lookup: slug > custom_domain > email
    if (slug && typeof slug === 'string') {
      query = query.eq('slug', slug);
    } else if (custom_domain && typeof custom_domain === 'string') {
      query = query.eq('custom_domain', custom_domain);
    } else if (email && typeof email === 'string') {
      query = query.eq('email_1', email);
    } else {
      return res.status(400).json({ error: 'Missing required parameter: slug, custom_domain, or email' });
    }

    const { data: company, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        return res.status(404).json({ error: 'Company not found' });
      }
      console.error('Company lookup error:', error);
      return res.status(500).json({ error: 'Failed to lookup company' });
    }

    // Return company data
    res.status(200).json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        email_1: company.email_1,
        logo_url: company.predicted_label === 'logo' ? company.logo_storage_path : null,
        slug: company.slug,
        custom_domain: company.custom_domain
      }
    });

  } catch (error) {
    console.error('Lookup company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}