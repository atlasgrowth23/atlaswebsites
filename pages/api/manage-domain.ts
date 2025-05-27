import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { companyId, customDomain } = req.body;

  if (!companyId || !customDomain) {
    return res.status(400).json({ message: 'Company ID and custom domain are required' });
  }

  try {
    // First, update the database with the custom domain
    await query(
      'UPDATE companies SET custom_domain = $1 WHERE id = $2',
      [customDomain, companyId]
    );

    // Add domain to Vercel project (using your correct project ID)
    const vercelResponse = await fetch(`https://api.vercel.com/v10/projects/prj_a7o4Q54HlqYt82IUzhOfLVuOoBxQ/domains`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: customDomain,
      }),
    });

    if (!vercelResponse.ok) {
      const errorData = await vercelResponse.text();
      console.error('Vercel API error:', errorData);
      
      // Still return success for database update, but note the Vercel issue
      return res.status(200).json({ 
        success: true, 
        message: 'Domain saved to database. Please manually add to Vercel dashboard.',
        vercelError: true 
      });
    }

    const vercelData = await vercelResponse.json();
    console.log('Domain added to Vercel:', vercelData);

    res.status(200).json({ 
      success: true, 
      message: 'Custom domain configured successfully!',
      vercelData 
    });
  } catch (error) {
    console.error('Domain management error:', error);
    res.status(500).json({ message: 'Failed to configure domain' });
  }
}