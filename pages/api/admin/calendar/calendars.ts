import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminSession } from '@/lib/auth-google';
import { getCalendarList, hasCalendarAccess } from '@/lib/calendar-utils';

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

    // Check if user has calendar access
    if (!hasCalendarAccess(session)) {
      return res.status(403).json({ 
        error: 'Calendar access not granted. Please reconnect your Google account with calendar permissions.' 
      });
    }

    const calendars = await getCalendarList(session);
    
    // Filter and format calendar data
    const formattedCalendars = calendars.map(calendar => ({
      id: calendar.id,
      summary: calendar.summary,
      description: calendar.description,
      primary: calendar.primary,
      accessRole: calendar.accessRole,
      backgroundColor: calendar.backgroundColor,
      foregroundColor: calendar.foregroundColor,
      timeZone: calendar.timeZone
    }));

    return res.status(200).json({ calendars: formattedCalendars });

  } catch (error) {
    console.error('Calendar list API error:', error);
    return res.status(500).json({ error: 'Failed to fetch calendars' });
  }
}