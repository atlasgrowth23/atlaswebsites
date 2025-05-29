import { NextApiRequest, NextApiResponse } from 'next';
import { logoQueue } from '@/lib/logoQueue';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { jobId } = req.query;

    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid jobId' });
    }

    const job = await logoQueue.getJobStatus(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.status(200).json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        processedUrl: job.processedUrl,
        error: job.error
      }
    });

  } catch (error) {
    console.error('Error getting logo job status:', error);
    res.status(500).json({ error: 'Failed to get job status' });
  }
}