import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📅 GoHighLevel webhook received:', JSON.stringify(req.body, null, 2));
    
    const { type, contact, appointment } = req.body;
    
    // Handle different GoHighLevel event types
    if (type !== 'AppointmentCreate' && type !== 'appointment.created') {
      console.log('ℹ️ Ignoring non-appointment event:', type);
      return res.status(200).json({ message: 'Event ignored' });
    }

    // Extract contact details
    const {
      firstName,
      lastName, 
      name,
      email,
      phone
    } = contact || {};

    const ownerName = name || `${firstName || ''} ${lastName || ''}`.trim() || 'Valued Customer';
    const ownerEmail = email;
    const phoneNumber = phone;

    // Extract appointment details  
    const {
      startTime,
      startDate,
      calendarId,
      title
    } = appointment || {};

    // Parse date/time (GoHighLevel format varies)
    let appointmentDate, appointmentTime;
    
    if (startTime && startDate) {
      const fullDateTime = new Date(`${startDate}T${startTime}`);
      appointmentDate = fullDateTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric', 
        month: 'long',
        day: 'numeric'
      });
      appointmentTime = fullDateTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else if (startTime) {
      // If only one timestamp provided
      const dateTime = new Date(startTime);
      appointmentDate = dateTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric', 
        month: 'long',
        day: 'numeric'
      });
      appointmentTime = dateTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }

    if (!appointmentDate || !appointmentTime) {
      console.error('❌ Could not parse appointment date/time:', { startTime, startDate });
      return res.status(400).json({ error: 'Invalid appointment date/time' });
    }

    // Determine who's handling this appointment based on calendar
    // You'll configure this in GoHighLevel with different calendars
    let setBy = 'nick'; // Default
    if (calendarId && calendarId.includes('jared')) {
      setBy = 'jared';
    }

    // Try to find company name from contact or use fallback
    const companyName = contact?.companyName || `${ownerName}'s Business`;

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

    // 🎯 AUTO-UPDATE PIPELINE if lead exists
    if (ownerEmail || phoneNumber) {
      try {
        console.log('🔍 Searching for existing lead...');
        
        let leadQuery = supabaseAdmin
          .from('lead_pipeline')
          .select(`
            id, 
            stage,
            company:companies!inner(*)
          `);

        // Search by email first, then phone
        if (ownerEmail) {
          leadQuery = leadQuery.eq('companies.email_1', ownerEmail);
        } else if (phoneNumber) {
          leadQuery = leadQuery.eq('companies.phone', phoneNumber.replace(/\D/g, ''));
        }

        const { data: existingLeads } = await leadQuery.limit(1);

        if (existingLeads && existingLeads.length > 0) {
          const lead = existingLeads[0];
          console.log(`🎯 Found existing lead: ${lead.id}`);

          // Update to appointment stage
          await supabaseAdmin
            .from('lead_pipeline')
            .update({ 
              stage: 'appointment',
              updated_at: new Date().toISOString()
            })
            .eq('id', lead.id);

          // Add activity log
          await supabaseAdmin
            .from('activity_log')
            .insert({
              lead_id: lead.id,
              company_id: lead.company.id,
              user_name: setBy,
              action: 'appointment_set',
              action_data: {
                appointment_date: appointmentDate,
                appointment_time: appointmentTime,
                source: 'gohighlevel_webhook',
                phone_number: phoneNumber
              }
            });

          console.log(`✅ Auto-moved lead ${lead.id} to appointment stage`);
        } else {
          console.log('ℹ️ No existing lead found for this contact');
        }

      } catch (error) {
        console.error('❌ Error updating pipeline:', error);
        // Don't fail the webhook for pipeline errors
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Appointment processed successfully',
      leadUpdated: true
    });

  } catch (error) {
    console.error('❌ GoHighLevel webhook error:', error);
    return res.status(500).json({ 
      error: 'Failed to process appointment',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}