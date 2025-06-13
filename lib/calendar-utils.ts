import { google } from 'googleapis';
import { getValidGoogleToken, AdminSession } from './auth-google';

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  location?: string;
  status?: 'confirmed' | 'tentative' | 'cancelled';
}

export interface CalendarEventsList {
  events: CalendarEvent[];
  nextPageToken?: string;
}

/**
 * Create a Google Calendar client using admin session tokens
 */
export async function createCalendarClient(session: AdminSession) {
  const accessToken = await getValidGoogleToken(session);
  if (!accessToken) {
    throw new Error('Failed to get valid Google access token');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: session.google_refresh_token
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Get list of calendars accessible to the user
 */
export async function getCalendarList(session: AdminSession) {
  try {
    const calendar = await createCalendarClient(session);
    const response = await calendar.calendarList.list();
    
    return response.data.items || [];
  } catch (error) {
    console.error('Error fetching calendar list:', error);
    throw new Error('Failed to fetch calendar list');
  }
}

/**
 * Get events from a specific calendar
 */
export async function getCalendarEvents(
  session: AdminSession,
  calendarId: string = 'primary',
  options?: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    pageToken?: string;
    singleEvents?: boolean;
    orderBy?: string;
  }
): Promise<CalendarEventsList> {
  try {
    const calendar = await createCalendarClient(session);
    
    const response = await calendar.events.list({
      calendarId,
      timeMin: options?.timeMin || new Date().toISOString(),
      timeMax: options?.timeMax,
      maxResults: options?.maxResults || 50,
      singleEvents: options?.singleEvents ?? true,
      orderBy: options?.orderBy || 'startTime',
      pageToken: options?.pageToken
    });

    const events = (response.data.items || []).map(event => ({
      id: event.id,
      summary: event.summary || 'No Title',
      description: event.description,
      start: {
        dateTime: event.start?.dateTime || event.start?.date || '',
        timeZone: event.start?.timeZone
      },
      end: {
        dateTime: event.end?.dateTime || event.end?.date || '',
        timeZone: event.end?.timeZone
      },
      attendees: event.attendees?.map(attendee => ({
        email: attendee.email || '',
        displayName: attendee.displayName
      })),
      location: event.location,
      status: event.status as 'confirmed' | 'tentative' | 'cancelled'
    }));

    return {
      events,
      nextPageToken: response.data.nextPageToken
    };
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw new Error('Failed to fetch calendar events');
  }
}

/**
 * Create a new calendar event
 */
export async function createCalendarEvent(
  session: AdminSession,
  event: CalendarEvent,
  calendarId: string = 'primary'
): Promise<CalendarEvent> {
  try {
    const calendar = await createCalendarClient(session);
    
    const response = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: event.start,
        end: event.end,
        attendees: event.attendees,
        location: event.location,
        status: event.status || 'confirmed'
      }
    });

    return {
      id: response.data.id,
      summary: response.data.summary || '',
      description: response.data.description,
      start: {
        dateTime: response.data.start?.dateTime || response.data.start?.date || '',
        timeZone: response.data.start?.timeZone
      },
      end: {
        dateTime: response.data.end?.dateTime || response.data.end?.date || '',
        timeZone: response.data.end?.timeZone
      },
      attendees: response.data.attendees?.map(attendee => ({
        email: attendee.email || '',
        displayName: attendee.displayName
      })),
      location: response.data.location,
      status: response.data.status as 'confirmed' | 'tentative' | 'cancelled'
    };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw new Error('Failed to create calendar event');
  }
}

/**
 * Update an existing calendar event
 */
export async function updateCalendarEvent(
  session: AdminSession,
  eventId: string,
  event: Partial<CalendarEvent>,
  calendarId: string = 'primary'
): Promise<CalendarEvent> {
  try {
    const calendar = await createCalendarClient(session);
    
    const response = await calendar.events.update({
      calendarId,
      eventId,
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: event.start,
        end: event.end,
        attendees: event.attendees,
        location: event.location,
        status: event.status
      }
    });

    return {
      id: response.data.id,
      summary: response.data.summary || '',
      description: response.data.description,
      start: {
        dateTime: response.data.start?.dateTime || response.data.start?.date || '',
        timeZone: response.data.start?.timeZone
      },
      end: {
        dateTime: response.data.end?.dateTime || response.data.end?.date || '',
        timeZone: response.data.end?.timeZone
      },
      attendees: response.data.attendees?.map(attendee => ({
        email: attendee.email || '',
        displayName: attendee.displayName
      })),
      location: response.data.location,
      status: response.data.status as 'confirmed' | 'tentative' | 'cancelled'
    };
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw new Error('Failed to update calendar event');
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(
  session: AdminSession,
  eventId: string,
  calendarId: string = 'primary'
): Promise<void> {
  try {
    const calendar = await createCalendarClient(session);
    
    await calendar.events.delete({
      calendarId,
      eventId
    });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw new Error('Failed to delete calendar event');
  }
}

/**
 * Get upcoming events for the next 7 days
 */
export async function getUpcomingEvents(
  session: AdminSession,
  calendarId: string = 'primary',
  days: number = 7
): Promise<CalendarEvent[]> {
  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  
  const result = await getCalendarEvents(session, calendarId, {
    timeMin,
    timeMax,
    maxResults: 20,
    singleEvents: true,
    orderBy: 'startTime'
  });
  
  return result.events;
}

/**
 * Create a calendar event for a pipeline lead appointment
 */
export async function createPipelineAppointment(
  session: AdminSession,
  leadData: {
    companyName: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    notes?: string;
  },
  appointmentData: {
    title: string;
    startTime: string;
    endTime: string;
    timeZone?: string;
  }
): Promise<CalendarEvent> {
  const event: CalendarEvent = {
    summary: `${appointmentData.title} - ${leadData.companyName}`,
    description: `
Pipeline Appointment

Company: ${leadData.companyName}
${leadData.contactEmail ? `Email: ${leadData.contactEmail}` : ''}
${leadData.contactPhone ? `Phone: ${leadData.contactPhone}` : ''}
${leadData.address ? `Address: ${leadData.address}` : ''}
${leadData.notes ? `Notes: ${leadData.notes}` : ''}
    `.trim(),
    start: {
      dateTime: appointmentData.startTime,
      timeZone: appointmentData.timeZone || 'America/Chicago'
    },
    end: {
      dateTime: appointmentData.endTime,
      timeZone: appointmentData.timeZone || 'America/Chicago'
    },
    location: leadData.address,
    attendees: leadData.contactEmail ? [{
      email: leadData.contactEmail,
      displayName: leadData.companyName
    }] : undefined,
    status: 'confirmed'
  };

  return createCalendarEvent(session, event);
}

/**
 * Check if user has calendar access by verifying scopes
 */
export function hasCalendarAccess(session: AdminSession): boolean {
  const requiredScopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ];
  
  return requiredScopes.some(scope => 
    session.google_scopes.some(userScope => 
      userScope.includes('calendar') || userScope === scope
    )
  );
}