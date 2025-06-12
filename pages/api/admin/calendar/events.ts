import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';
import { getCalendarClient } from '../../../../lib/googleClient';

async function ensureTeamCalendar(userId: string) {
  // Check if team calendar exists in settings
  const { data: settings } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', 'team_calendar_id')
    .single();

  let teamCalendarId = settings?.value;
  
  if (!teamCalendarId || teamCalendarId === 'null') {
    // Create the shared calendar
    const calendar = await getCalendarClient(userId);
    
    const { data: newCalendar } = await calendar.calendars.insert({
      requestBody: {
        summary: 'Atlas Shared',
        description: 'Shared calendar for Atlas team',
        timeZone: 'America/New_York'
      }
    });
    
    teamCalendarId = newCalendar.id;
    
    // Share with team members
    const teamEmails = ['nicholas@atlasgrowth.ai', 'jared@atlasgrowth.ai'];
    
    for (const email of teamEmails) {
      try {
        await calendar.acl.insert({
          calendarId: teamCalendarId,
          requestBody: {
            role: 'writer',
            scope: {
              type: 'user',
              value: email
            }
          }
        });
      } catch (error) {
        console.error(`Failed to share calendar with ${email}:`, error);
      }
    }
    
    // Store in settings
    await supabase
      .from('admin_settings')
      .upsert({
        key: 'team_calendar_id',
        value: teamCalendarId
      });
  }
  
  return teamCalendarId;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
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

    if (req.method === 'GET') {
      const { tab = 'my', timeMin, timeMax } = req.query;

      let events = [];

      if (tab === 'my' || tab === 'all') {
        // Get user's primary calendar events
        try {
          const calendar = await getCalendarClient(user.id);
          
          const { data: googleEvents } = await calendar.events.list({
            calendarId: 'primary',
            timeMin: timeMin as string,
            timeMax: timeMax as string,
            singleEvents: true,
            orderBy: 'startTime'
          });
          
          if (googleEvents.items) {
            events.push(...googleEvents.items.map((event: any) => ({
              ...event,
              source: 'google',
              type: 'my'
            })));
          }
        } catch (error) {
          console.error('Error fetching my calendar events:', error);
        }
      }

      if (tab === 'shared' || tab === 'all') {
        // Get shared calendar events
        try {
          const teamCalendarId = await ensureTeamCalendar(user.id);
          const calendar = await getCalendarClient(user.id);
          
          const { data: sharedEvents } = await calendar.events.list({
            calendarId: teamCalendarId,
            timeMin: timeMin as string,
            timeMax: timeMax as string,
            singleEvents: true,
            orderBy: 'startTime'
          });
          
          if (sharedEvents.items) {
            events.push(...sharedEvents.items.map((event: any) => ({
              ...event,
              source: 'shared',
              type: 'shared'
            })));
          }
        } catch (error) {
          console.error('Error fetching shared calendar events:', error);
        }
      }

      if (tab === 'all' && user.email !== 'nicholas@atlasgrowth.ai') {
        // Super admin can see all events including Jared's
        // This would fetch Jared's calendar events
      }

      res.status(200).json({ events });
    } else if (req.method === 'POST') {
      const { summary, start, end, attendees, location, calendarType = 'shared' } = req.body;

      if (!summary || !start || !end) {
        return res.status(400).json({ error: 'Summary, start, and end are required' });
      }

      // Check working hours for the event creator
      const startTime = new Date(start.dateTime);
      const hour = startTime.getHours();
      
      // Mock working hours check - get from admin_users table in real implementation
      const workingStart = 9; // 9 AM
      const workingEnd = 17; // 5 PM
      
      if (hour < workingStart || hour >= workingEnd) {
        return res.status(400).json({ 
          error: 'Outside working hours',
          warning: `Event is outside working hours (${workingStart}:00 - ${workingEnd}:00). Save anyway?`
        });
      }

      const newEvent = {
        summary,
        start,
        end,
        attendees,
        location,
        creator: user.email
      };

      if (calendarType === 'shared') {
        // Create in shared calendar
        try {
          const teamCalendarId = await ensureTeamCalendar(user.id);
          const calendar = await getCalendarClient(user.id);
          
          const { data: createdEvent } = await calendar.events.insert({
            calendarId: teamCalendarId,
            requestBody: newEvent
          });
          
          res.status(201).json({ event: createdEvent });
        } catch (error) {
          console.error('Error creating shared calendar event:', error);
          res.status(500).json({ error: 'Failed to create calendar event' });
        }
      } else if (calendarType === 'my') {
        // Create in user's primary calendar
        try {
          const calendar = await getCalendarClient(user.id);
          
          const { data: createdEvent } = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: newEvent
          });
          
          res.status(201).json({ event: createdEvent });
        } catch (error) {
          console.error('Error creating personal calendar event:', error);
          res.status(500).json({ error: 'Failed to create calendar event' });
        }
      } else {
        res.status(400).json({ error: 'Invalid calendar type' });
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Calendar events API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}