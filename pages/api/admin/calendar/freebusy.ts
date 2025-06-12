import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';
import { getCalendarClient } from '../../../../lib/googleClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { timeMin, timeMax, calendarIds } = req.body;

    if (!timeMin || !timeMax) {
      return res.status(400).json({ error: 'timeMin and timeMax are required' });
    }

    // Get current user
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const calendar = await getCalendarClient(user.id);

    // Default to primary calendar if no calendar IDs provided
    const calendarsToCheck = calendarIds || ['primary'];

    // Check free/busy status
    const { data: freeBusyData } = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin,
        timeMax: timeMax,
        items: calendarsToCheck.map((id: string) => ({ id }))
      }
    });

    // Also get the shared team calendar ID from settings
    const { data: settings } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'team_calendar_id')
      .single();

    const teamCalendarId = settings?.value;

    // If we have a team calendar, check that too
    if (teamCalendarId && teamCalendarId !== 'null') {
      const { data: teamFreeBusy } = await calendar.freebusy.query({
        requestBody: {
          timeMin: timeMin,
          timeMax: timeMax,
          items: [{ id: teamCalendarId }]
        }
      });

      // Merge team calendar data
      if (teamFreeBusy.calendars) {
        freeBusyData.calendars = {
          ...freeBusyData.calendars,
          ...teamFreeBusy.calendars
        };
      }
    }

    res.status(200).json(freeBusyData);

  } catch (error) {
    console.error('Free/busy check error:', error);
    res.status(500).json({ error: 'Failed to check calendar availability' });
  }
}