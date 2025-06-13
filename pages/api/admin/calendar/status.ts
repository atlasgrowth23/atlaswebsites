import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminSession } from '@/lib/auth-google';
import { hasCalendarAccess } from '@/lib/calendar-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionToken = req.cookies.admin_session;
    
    if (!sessionToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const session = await getAdminSession(sessionToken);
    
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const hasAccess = hasCalendarAccess(session);
    
    return res.status(200).json({
      hasCalendarAccess: hasAccess,
      scopes: session.google_scopes,
      tokenExpiresAt: session.google_token_expires_at
    });

  } catch (error) {
    console.error('Calendar status API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}