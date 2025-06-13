import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminSession } from '@/lib/auth-google';
import { createPipelineAppointment, hasCalendarAccess } from '@/lib/calendar-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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

    const { leadData, appointmentData } = req.body;

    // Validate required fields
    if (!leadData?.companyName || !appointmentData?.title || 
        !appointmentData?.startTime || !appointmentData?.endTime) {
      return res.status(400).json({ 
        error: 'Missing required fields: leadData.companyName, appointmentData.title, appointmentData.startTime, appointmentData.endTime' 
      });
    }

    // Validate date times
    try {
      new Date(appointmentData.startTime).toISOString();
      new Date(appointmentData.endTime).toISOString();
    } catch (error) {
      return res.status(400).json({ error: 'Invalid date format for startTime or endTime' });
    }

    const createdEvent = await createPipelineAppointment(session, leadData, appointmentData);
    
    return res.status(201).json({ 
      success: true, 
      event: createdEvent,
      message: 'Pipeline appointment created successfully'
    });

  } catch (error) {
    console.error('Pipeline appointment API error:', error);
    return res.status(500).json({ error: 'Failed to create pipeline appointment' });
  }
}