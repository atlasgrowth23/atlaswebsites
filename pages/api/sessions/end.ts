import { NextApiRequest, NextApiResponse } from 'next';
import { endActiveSession } from '@/lib/activityTracker';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userName } = req.body;

    if (!userName) {
      return res.status(400).json({ error: 'userName is required' });
    }

    const result = await endActiveSession(userName);

    if (!result.success) {
      return res.status(500).json({ error: result.error?.message || 'Failed to end session' });
    }

    return res.status(200).json({ 
      success: true, 
      session: result.session 
    });

  } catch (error) {
    console.error('End session API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}