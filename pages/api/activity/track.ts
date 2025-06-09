import { NextApiRequest, NextApiResponse } from 'next';
import { trackActivity, getActiveSession } from '@/lib/activityTracker';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { leadId, companyId, userName, action, actionData } = req.body;

    // Validate required fields
    if (!leadId || !companyId || !userName || !action) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['leadId', 'companyId', 'userName', 'action']
      });
    }

    // Get active session (if any)
    const activeSession = await getActiveSession(userName);
    const sessionId = activeSession?.id || null;

    // Track the activity
    const result = await trackActivity({
      sessionId,
      leadId,
      companyId,
      userName,
      action,
      actionData
    });

    if (!result.success) {
      return res.status(500).json({ error: 'Failed to track activity' });
    }

    return res.status(200).json({ 
      success: true, 
      sessionActive: !!sessionId,
      sessionId 
    });

  } catch (error) {
    console.error('Activity tracking API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}