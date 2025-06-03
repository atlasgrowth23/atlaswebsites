import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get all companies with custom domains from Supabase
    const { data: companies, error } = await supabase
      .from('companies')
      .select('slug, custom_domain')
      .not('custom_domain', 'is', null);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ message: 'Database error' });
    }

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

    // Sync to Vercel Edge Config
    if (process.env.EDGE_CONFIG && process.env.VERCEL_TOKEN) {
      // Extract base URL without token
      const baseUrl = process.env.EDGE_CONFIG.split('?')[0];
      const edgeConfigUrl = `${baseUrl}/items`;
      console.log('Syncing to:', edgeConfigUrl);
      
      const response = await fetch(edgeConfigUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`,
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

      console.log('Edge Config response status:', response.status);
      const responseText = await response.text();
      console.log('Edge Config response:', responseText);

      if (!response.ok) {
        throw new Error(`Edge Config sync failed: ${response.status} ${responseText}`);
      }
    } else {
      throw new Error('Missing EDGE_CONFIG or VERCEL_TOKEN environment variables');
    }

    res.status(200).json({ 
      message: 'Domains synced successfully',
      domains: Object.keys(domainMap).length
    });

  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ message: 'Sync failed' });
  }
}