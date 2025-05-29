import { NextApiRequest, NextApiResponse } from 'next';
import { cache } from '@/lib/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const stats = cache.getStats();
      
      res.status(200).json({
        success: true,
        stats: {
          ...stats,
          memoryUsageKB: Math.round(stats.memoryUsage / 1024),
        }
      });
    } catch (error) {
      console.error('Error getting cache stats:', error);
      res.status(500).json({ error: 'Failed to get cache stats' });
    }
  } else if (req.method === 'DELETE') {
    try {
      cache.clear();
      res.status(200).json({ success: true, message: 'Cache cleared' });
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({ error: 'Failed to clear cache' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}