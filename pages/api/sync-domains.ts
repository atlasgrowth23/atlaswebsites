import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Starting domain sync...');
    
    // Get all companies with custom domains from Supabase
    const { data: companies, error } = await supabase
      .from('companies')
      .select('slug, custom_domain')
      .not('custom_domain', 'is', null);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ message: 'Database error', error: error.message });
    }

    console.log('Found companies:', companies?.length || 0);

    // Build domain mapping for Edge Config
    const domainMap: Record<string, string> = {};
    
    companies?.forEach(company => {
      if (company.custom_domain && company.slug) {
        // Store both www and non-www versions
        const domain = company.custom_domain;
        domainMap[domain] = company.slug;
        
        // Handle www variants
        if (domain.startsWith('www.')) {
          domainMap[domain.substring(4)] = company.slug;
        } else {
          domainMap[`www.${domain}`] = company.slug;
        }
      }
    });

    console.log('Domain map to sync:', domainMap);
    console.log('EDGE_CONFIG:', process.env.EDGE_CONFIG ? 'Set' : 'Not set');
    console.log('VERCEL_TOKEN:', process.env.VERCEL_TOKEN ? 'Set' : 'Not set');

    // Update Edge Config via Vercel API
    console.log('VERCEL_TOKEN exists:', !!process.env.VERCEL_TOKEN);
    
    const response = await fetch('https://api.vercel.com/v1/edge-config/ecfg_bgv5df8qg5vai2ptqyldpbbysjo5/items', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer wtXMcEx3zz7tWx6vibCb9BD9`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            operation: 'upsert',
            key: 'custom_domains',
            value: domainMap
          }
        ]
      })
    });

    const responseData = await response.text();
    console.log('Edge Config API response:', response.status, responseData);

    if (!response.ok) {
      throw new Error(`Edge Config update failed: ${response.status} - ${responseData}`);
    }

    console.log('Successfully synced domains to Edge Config');

    res.status(200).json({ 
      message: 'Domains synced successfully',
      domains: Object.keys(domainMap).length
    });

  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ 
      message: 'Sync failed', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
