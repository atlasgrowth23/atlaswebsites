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
    const { lead_id, email, subject, template = 'basic' } = req.body;

    if (!lead_id || !email || !subject) {
      return res.status(400).json({ error: 'Lead ID, email, and subject are required' });
    }

    // Get lead details for email personalization
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        *,
        companies!inner(name, slug, city, state)
      `)
      .eq('id', lead_id)
      .single();

    if (leadError || !lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // TODO: Integrate with actual email service (SendGrid, etc.)
    // For now, we'll just log the activity without actually sending
    
    const emailBody = generateEmailBody(template, lead, subject);
    
    // Log email activity
    const { data: activity, error: activityError } = await supabase
      .from('lead_activity')
      .insert({
        lead_id,
        activity_type: 'email',
        description: `Email sent to ${email}: ${subject}`,
        metadata: {
          to: email,
          subject,
          template,
          status: 'simulated', // Change to 'sent' when real email is implemented
          timestamp: new Date().toISOString(),
          body_preview: emailBody.substring(0, 200) + '...'
        }
      })
      .select('*')
      .single();

    if (activityError) {
      console.error('Error logging email activity:', activityError);
      return res.status(500).json({ error: 'Failed to log email activity' });
    }

    // TODO: Replace this simulation with actual email sending
    // Example SendGrid integration:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: email,
      from: process.env.FROM_EMAIL,
      subject: subject,
      html: emailBody,
    };

    const emailResult = await sgMail.send(msg);

    // Update activity with real status
    await supabase
      .from('lead_activity')
      .update({
        metadata: {
          ...activity.metadata,
          status: 'sent',
          message_id: emailResult[0].headers['x-message-id']
        }
      })
      .eq('id', activity.id);
    */

    res.status(200).json({
      success: true,
      message: 'Email logged (simulation mode)',
      activity
    });
  } catch (error) {
    console.error('Email API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function generateEmailBody(template: string, lead: any, subject: string): string {
  const companyName = lead.companies.name;
  const ownerName = lead.owner_name || 'there';
  
  switch (template) {
    case 'introduction':
      return `
        <h2>Hi ${ownerName},</h2>
        <p>I hope this email finds you well. My name is [Your Name] and I help HVAC contractors like ${companyName} grow their business through professional websites and digital marketing.</p>
        <p>I noticed that ${companyName} provides excellent HVAC services in ${lead.companies.city}, ${lead.companies.state}, and I'd love to discuss how we can help you attract more customers online.</p>
        <p>Would you be open to a brief 15-minute conversation this week?</p>
        <p>Best regards,<br/>[Your Name]</p>
      `;
    case 'follow-up':
      return `
        <h2>Hi ${ownerName},</h2>
        <p>Following up on our recent conversation about ${companyName}'s online presence.</p>
        <p>I wanted to see if you had any questions about our website solution and how it can help bring more customers to your business.</p>
        <p>I'm here to help whenever you're ready to take the next step.</p>
        <p>Best regards,<br/>[Your Name]</p>
      `;
    case 'proposal':
      return `
        <h2>Hi ${ownerName},</h2>
        <p>Thank you for your time today discussing ${companyName}'s website needs.</p>
        <p>As promised, I've attached a customized proposal that outlines how our solution can help ${companyName} attract more customers and grow your business.</p>
        <p>Please review it and let me know if you have any questions. I'm excited about the possibility of working together.</p>
        <p>Best regards,<br/>[Your Name]</p>
      `;
    default:
      return `
        <h2>Hi ${ownerName},</h2>
        <p>Thank you for your interest in our services for ${companyName}.</p>
        <p>I'll be in touch soon with next steps.</p>
        <p>Best regards,<br/>[Your Name]</p>
      `;
  }
}