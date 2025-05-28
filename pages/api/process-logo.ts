import { NextApiRequest, NextApiResponse } from 'next';
import { processLogo } from '../../lib/processLogo';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { companySlug, logoUrl } = req.body;

    if (!companySlug || !logoUrl) {
      return res.status(400).json({ error: 'Missing companySlug or logoUrl' });
    }

    console.log(`Processing logo for ${companySlug}: ${logoUrl}`);

    // Process the logo and get the optimized URL
    const processedUrl = await processLogo(companySlug, logoUrl);

    if (processedUrl) {
      res.status(200).json({ 
        success: true, 
        processedUrl,
        message: 'Logo processed successfully'
      });
    } else {
      // Still return success but with original URL
      res.status(200).json({ 
        success: true, 
        processedUrl: logoUrl,
        message: 'Logo processing skipped, using original URL'
      });
    }
  } catch (error) {
    console.error('Error processing logo:', error);
    res.status(500).json({ 
      error: 'Failed to process logo',
      processedUrl: req.body.logoUrl // Fallback to original URL
    });
  }
}