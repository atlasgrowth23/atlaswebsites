import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Simple tracking endpoint - you can expand this later
    const { templateKey, companySlug } = req.body;
    
    // For now, just return success
    // You can add database logging here later if needed
    console.log(`Template view tracked: ${templateKey} for ${companySlug}`);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error tracking template view:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}