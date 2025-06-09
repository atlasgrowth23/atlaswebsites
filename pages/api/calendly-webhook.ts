import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📅 Calendly webhook received:', JSON.stringify(req.body, null, 2));
    
    const { event, payload } = req.body;
    
    if (event !== 'invitee.created') {
      console.log('ℹ️ Ignoring non-booking event:', event);
      return res.status(200).json({ message: 'Event ignored' });
    }

    // Extract appointment details
    const {
      name: ownerName,
      email: ownerEmail,
      event_start_time,
      event_end_time,
      questions_and_answers = []
    } = payload;

    // Parse date/time
    const startDate = new Date(event_start_time);
    const appointmentDate = startDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    });
    const appointmentTime = startDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Try to determine company name from questions or use fallback
    const companyQuestion = questions_and_answers.find((qa: any) => 
      qa.question.toLowerCase().includes('company') || 
      qa.question.toLowerCase().includes('business')
    );
    const companyName = companyQuestion?.answer || `${ownerName}'s Business`;

    // Get phone number if provided
    const phoneQuestion = questions_and_answers.find((qa: any) => 
      qa.question.toLowerCase().includes('phone') || 
      qa.question.toLowerCase().includes('number')
    );
    const phoneNumber = phoneQuestion?.answer;

    // Determine who set this (you'll need to configure this in Calendly)
    // For now, default to 'nick' - you can add this as a hidden field in Calendly
    const setBy = 'nick'; // TODO: Configure in Calendly custom fields

    console.log('📧 Sending appointment confirmation email...');

    // Send confirmation email
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/send-appointment-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerEmail,
        ownerName,
        companyName,
        appointmentDate,
        appointmentTime,
        phoneNumber,
        setBy
      })
    });

    if (emailResponse.ok) {
      console.log('✅ Appointment confirmation email sent successfully');
    } else {
      const errorText = await emailResponse.text();
      console.error('❌ Failed to send email:', errorText);
    }

    // TODO: Also update pipeline if this person exists in your system
    // You could search for them by email or phone and auto-move to 'appointment' stage

    return res.status(200).json({ 
      success: true, 
      message: 'Appointment processed successfully' 
    });

  } catch (error) {
    console.error('❌ Calendly webhook error:', error);
    return res.status(500).json({ 
      error: 'Failed to process appointment',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}