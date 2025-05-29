import { NextApiRequest, NextApiResponse } from 'next';
import { logoQueue } from '@/lib/logoQueue';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stats = logoQueue.getStats();
    
    res.status(200).json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error getting logo queue stats:', error);
    res.status(500).json({ error: 'Failed to get queue stats' });
  }
}