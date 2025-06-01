import { NextApiRequest, NextApiResponse } from 'next';
import { getCompanyBySlug } from '@/lib/supabase-db';
import { processLogo } from '@/lib/processLogo';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;

  try {
    // Get company data
    const company = await getCompanyBySlug(slug as string);
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Process logo if available
    const logoUrl = await processLogo(company.slug, company.logo || null);
    
    if (logoUrl) {
      // Serve the processed logo directly
      const logoPath = path.join(process.cwd(), 'public', logoUrl);
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
        return res.send(logoBuffer);
      }
    }

    // Fallback: create a simple text-based image or redirect to a default
    res.setHeader('Content-Type', 'text/plain');
    res.status(404).send('Logo not found');
    
  } catch (error) {
    console.error('Error in og-image API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}