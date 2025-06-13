import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminSession } from '@/lib/auth-google';
import { 
  getCalendarEvents, 
  createCalendarEvent, 
  updateCalendarEvent, 
  deleteCalendarEvent,
  CalendarEvent,
  hasCalendarAccess 
} from '@/lib/calendar-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    const { calendarId = 'primary' } = req.query;

    switch (req.method) {
      case 'GET':
        return handleGetEvents(req, res, session, calendarId as string);
      
      case 'POST':
        return handleCreateEvent(req, res, session, calendarId as string);
      
      case 'PUT':
        return handleUpdateEvent(req, res, session, calendarId as string);
      
      case 'DELETE':
        return handleDeleteEvent(req, res, session, calendarId as string);
      
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Calendar events API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGetEvents(
  req: NextApiRequest,
  res: NextApiResponse,
  session: any,
  calendarId: string
) {
  try {
    const { 
      timeMin, 
      timeMax, 
      maxResults, 
      pageToken,
      upcoming 
    } = req.query;

    let options: any = {};
    
    if (timeMin) options.timeMin = timeMin as string;
    if (timeMax) options.timeMax = timeMax as string;
    if (maxResults) options.maxResults = parseInt(maxResults as string);
    if (pageToken) options.pageToken = pageToken as string;

    // Special handling for upcoming events
    if (upcoming === 'true') {
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      options.timeMin = now.toISOString();
      options.timeMax = nextWeek.toISOString();
      options.maxResults = 20;
    }

    const eventsData = await getCalendarEvents(session, calendarId, options);
    
    return res.status(200).json(eventsData);
  } catch (error) {
    console.error('Error fetching events:', error);
    return res.status(500).json({ error: 'Failed to fetch events' });
  }
}

async function handleCreateEvent(
  req: NextApiRequest,
  res: NextApiResponse,
  session: any,
  calendarId: string
) {
  try {
    const eventData: CalendarEvent = req.body;

    // Validate required fields
    if (!eventData.summary || !eventData.start?.dateTime || !eventData.end?.dateTime) {
      return res.status(400).json({ 
        error: 'Missing required fields: summary, start.dateTime, end.dateTime' 
      });
    }

    const createdEvent = await createCalendarEvent(session, eventData, calendarId);
    
    return res.status(201).json(createdEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({ error: 'Failed to create event' });
  }
}

async function handleUpdateEvent(
  req: NextApiRequest,
  res: NextApiResponse,
  session: any,
  calendarId: string
) {
  try {
    const { eventId } = req.query;
    
    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    const eventData: Partial<CalendarEvent> = req.body;
    
    const updatedEvent = await updateCalendarEvent(
      session, 
      eventId as string, 
      eventData, 
      calendarId
    );
    
    return res.status(200).json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    return res.status(500).json({ error: 'Failed to update event' });
  }
}

async function handleDeleteEvent(
  req: NextApiRequest,
  res: NextApiResponse,
  session: any,
  calendarId: string
) {
  try {
    const { eventId } = req.query;
    
    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }
    
    await deleteCalendarEvent(session, eventId as string, calendarId);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return res.status(500).json({ error: 'Failed to delete event' });
  }
}