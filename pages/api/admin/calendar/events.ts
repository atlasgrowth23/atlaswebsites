import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';

// Mock Google Calendar API - replace with actual Google Calendar integration
const mockGoogleCalendarAPI = {
  async getEvents(accessToken: string, calendarId: string, timeMin: string, timeMax: string) {
    // TODO: Implement actual Google Calendar API calls
    return {
      items: [
        {
          id: 'mock-event-1',
          summary: 'Team Meeting',
          start: { dateTime: '2024-06-11T10:00:00Z' },
          end: { dateTime: '2024-06-11T11:00:00Z' },
          attendees: [
            { email: 'nicholas@atlasgrowth.ai' },
            { email: 'jared@atlasgrowth.ai' }
          ]
        }
      ]
    };
  },

  async createEvent(accessToken: string, calendarId: string, event: any) {
    // TODO: Implement actual Google Calendar API calls
    return {
      id: 'new-event-' + Date.now(),
      ...event
    };
  }
};

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
        // Get user's Google Calendar events
        const { data: tokens } = await supabase
          .from('admin_user_tokens')
          .select('access_token')
          .eq('user_id', user.id)
          .eq('provider', 'google')
          .single();

        if (tokens?.access_token) {
          const googleEvents = await mockGoogleCalendarAPI.getEvents(
            tokens.access_token,
            'primary',
            timeMin as string,
            timeMax as string
          );
          events.push(...googleEvents.items.map((event: any) => ({
            ...event,
            source: 'google',
            type: 'my'
          })));
        }
      }

      if (tab === 'shared' || tab === 'all') {
        // Get shared calendar events (mock for now)
        const sharedEvents = [
          {
            id: 'shared-1',
            summary: 'Client Call - HVAC Consultation',
            start: { dateTime: '2024-06-12T14:00:00Z' },
            end: { dateTime: '2024-06-12T15:00:00Z' },
            attendees: [
              { email: 'nicholas@atlasgrowth.ai' },
              { email: 'jared@atlasgrowth.ai' }
            ],
            source: 'shared',
            type: 'shared'
          }
        ];
        events.push(...sharedEvents);
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
        const { data: tokens } = await supabase
          .from('admin_user_tokens')
          .select('access_token')
          .eq('user_id', user.id)
          .eq('provider', 'google')
          .single();

        if (tokens?.access_token) {
          const createdEvent = await mockGoogleCalendarAPI.createEvent(
            tokens.access_token,
            'atlas-shared', // Shared calendar ID
            newEvent
          );
          res.status(201).json({ event: createdEvent });
        } else {
          res.status(400).json({ error: 'No Google Calendar access token found' });
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