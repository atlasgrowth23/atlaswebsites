import type { NextApiRequest, NextApiResponse } from 'next';
import { updateCompany, getCompanyById } from '@/lib/supabase-db';

async function syncEdgeConfig() {
  try {
    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/sync-domains`, {
      method: 'POST'
    });
    if (!response.ok) {
      console.error('Failed to sync Edge Config');
    }
  } catch (error) {
    console.error('Edge Config sync error:', error);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { companyId, customDomain } = req.body;

  if (req.method === 'POST') {
    if (!companyId || !customDomain) {
      return res.status(400).json({ message: 'Company ID and custom domain are required' });
    }

    try {
      // Get company to validate it exists
      const company = await getCompanyById(companyId);
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      // Update database with custom domain
      await updateCompany(companyId, { custom_domain: customDomain });

      // Sync to Edge Config for middleware routing
      await syncEdgeConfig();

      res.status(200).json({ 
        success: true, 
        message: 'Domain saved! Remember to manually add it to Vercel and configure DNS.'
      });
    } catch (error) {
      console.error('Domain management error:', error);
      res.status(500).json({ message: 'Failed to save domain' });
    }
  } 
  else if (req.method === 'DELETE') {
    if (!companyId) {
      return res.status(400).json({ message: 'Company ID is required' });
    }

    try {
      // Get company to validate
      const company = await getCompanyById(companyId);
      if (!company || !company.custom_domain) {
        return res.status(404).json({ message: 'Company or domain not found' });
      }

      // Remove from database
      await updateCompany(companyId, { custom_domain: undefined });

      // Sync to Edge Config
      await syncEdgeConfig();

      res.status(200).json({ 
        success: true, 
        message: 'Domain removed from routing. Remember to manually remove from Vercel.' 
      });
    } catch (error) {
      console.error('Domain removal error:', error);
      res.status(500).json({ message: 'Failed to remove domain' });
    }
  } 
  else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}