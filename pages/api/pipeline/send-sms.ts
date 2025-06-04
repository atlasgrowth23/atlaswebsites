import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { lead_id, phone, message } = req.body;

    if (!lead_id || !phone || !message) {
      return res.status(400).json({ error: 'Lead ID, phone, and message are required' });
    }

    // TODO: Integrate with actual SMS service (Twilio, etc.)
    // For now, we'll just log the activity without actually sending
    
    // Log SMS activity
    const { data: activity, error: activityError } = await supabase
      .from('lead_activity')
      .insert({
        lead_id,
        activity_type: 'sms',
        description: `SMS sent to ${phone}: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
        metadata: {
          phone,
          message,
          status: 'simulated', // Change to 'sent' when real SMS is implemented
          timestamp: new Date().toISOString()
        }
      })
      .select('*')
      .single();

    if (activityError) {
      console.error('Error logging SMS activity:', activityError);
      return res.status(500).json({ error: 'Failed to log SMS activity' });
    }

    // TODO: Replace this simulation with actual SMS sending
    // Example Twilio integration:
    /*
    const twilioClient = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const smsResult = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });

    // Update activity with real status
    await supabase
      .from('lead_activity')
      .update({
        metadata: {
          ...activity.metadata,
          status: 'sent',
          sid: smsResult.sid
        }
      })
      .eq('id', activity.id);
    */

    res.status(200).json({
      success: true,
      message: 'SMS logged (simulation mode)',
      activity
    });
  } catch (error) {
    console.error('SMS API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}