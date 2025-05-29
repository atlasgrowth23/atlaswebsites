import { NextApiRequest, NextApiResponse } from 'next';
import { logoQueue } from '@/lib/logoQueue';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { companySlug, logoUrl } = req.body;

    if (!companySlug || !logoUrl) {
      return res.status(400).json({ error: 'Missing companySlug or logoUrl' });
    }

    // Add job to queue
    const jobId = await logoQueue.addJob(companySlug, logoUrl);

    res.status(202).json({ 
      success: true, 
      jobId,
      message: 'Logo processing job queued'
    });

  } catch (error) {
    console.error('Error queuing logo processing job:', error);
    res.status(500).json({ error: 'Failed to queue logo processing job' });
  }
}