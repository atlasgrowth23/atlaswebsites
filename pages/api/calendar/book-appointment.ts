import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      companyName,
      ownerName,
      ownerEmail,
      phoneNumber,
      appointmentDate,
      appointmentTime,
      createdBy,
      notes
    } = req.body;

    // Validate required fields
    if (!companyName || !ownerName || !ownerEmail || !appointmentDate || !appointmentTime || !createdBy) {
      return res.status(400).json({ 
        error: 'Missing required fields: companyName, ownerName, ownerEmail, appointmentDate, appointmentTime, createdBy' 
      });
    }

    // Check for conflicting appointments at the same time
    const { data: existingAppointments } = await supabaseAdmin
      .from('appointments')
      .select('id')
      .eq('appointment_date', appointmentDate)
      .eq('appointment_time', appointmentTime)
      .eq('status', 'scheduled');

    if (existingAppointments && existingAppointments.length > 0) {
      return res.status(409).json({ 
        error: 'Time slot already booked. Please choose a different time.' 
      });
    }

    // Try to find existing lead by email or phone
    let leadId = null;
    if (ownerEmail || phoneNumber) {
      const { data: existingLead } = await supabaseAdmin
        .from('lead_pipeline')
        .select(`
          id,
          company:companies!inner(*)
        `)
        .or(`companies.email_1.eq.${ownerEmail}${phoneNumber ? `,companies.phone.eq.${phoneNumber.replace(/\D/g, '')}` : ''}`)
        .limit(1)
        .single();

      if (existingLead) {
        leadId = existingLead.id;
        console.log(`🎯 Found existing lead: ${leadId}`);
        
        // Update pipeline stage to appointment
        await supabaseAdmin
          .from('lead_pipeline')
          .update({ 
            stage: 'appointment',
            updated_at: new Date().toISOString()
          })
          .eq('id', leadId);

        // Add activity log
        await supabaseAdmin
          .from('activity_log')
          .insert({
            lead_id: leadId,
            company_id: existingLead.company.id,
            user_name: createdBy,
            action: 'appointment_set',
            action_data: {
              appointment_date: appointmentDate,
              appointment_time: appointmentTime,
              source: 'internal_calendar',
              phone_number: phoneNumber,
              notes: notes
            }
          });

        console.log(`✅ Updated existing lead ${leadId} to appointment stage`);
      }
    }

    // Create appointment record
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .insert([{
        lead_id: leadId,
        company_name: companyName,
        owner_name: ownerName,
        owner_email: ownerEmail,
        phone_number: phoneNumber || null,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        created_by: createdBy,
        status: 'scheduled',
        notes: notes || null
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating appointment:', error);
      return res.status(500).json({ error: 'Failed to create appointment' });
    }

    return res.status(200).json({
      success: true,
      appointment,
      leadUpdated: !!leadId,
      message: 'Appointment booked successfully'
    });

  } catch (error) {
    console.error('Book appointment API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}