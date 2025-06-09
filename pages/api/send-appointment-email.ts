import { NextApiRequest, NextApiResponse } from 'next';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
console.log('SendGrid API Key check:', process.env.SENDGRID_API_KEY ? 'Found' : 'Missing');
console.log('API key starts with SG:', process.env.SENDGRID_API_KEY?.startsWith('SG.'));
console.log('API key first 10 chars:', process.env.SENDGRID_API_KEY?.substring(0, 10));
console.log('API key length:', process.env.SENDGRID_API_KEY?.length);

if (!process.env.SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY is not set!');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      ownerEmail, 
      ownerName, 
      companyName, 
      appointmentDate, 
      appointmentTime,
      phoneNumber,
      setBy // 'nick' or 'jared'
    } = req.body;

    if (!ownerEmail || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ 
        error: 'Missing required fields: ownerEmail, appointmentDate, appointmentTime' 
      });
    }

    // Personal contact info based on who set the appointment
    const personalInfo = setBy === 'jared' ? {
      name: 'Jared Thompson',
      phone: '501-626-3152',
      email: 'jared@atlasgrowth.ai'
    } : {
      name: 'Nick Sanford', 
      phone: '205-500-5170',
      email: 'nick@atlasgrowth.ai'
    };

    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Your Atlas Growth Consultation</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f9f9f9; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 4px; padding: 30px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #333; margin: 0; font-size: 24px; }
            .company-name { color: #4a90e2; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
            .appointment-box { background: #f8f9fa; border-left: 4px solid #4a90e2; padding: 20px; margin: 20px 0; }
            .appointment-detail { margin: 8px 0; font-size: 16px; }
            .label { font-weight: bold; color: #333; }
            .value { color: #4a90e2; font-weight: 600; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="company-name">ATLAS GROWTH</div>
                <h1>Your Consultation is Confirmed</h1>
            </div>
            
            <p>Hi ${ownerName || 'there'},</p>
            
            <p>Thank you for scheduling a consultation with Atlas Growth. We're looking forward to discussing how we can help <strong>${companyName}</strong> grow its online presence.</p>
            
            <div class="appointment-box">
                <h3 style="margin-top: 0; color: #333;">Appointment Details</h3>
                <div class="appointment-detail">
                    <span class="label">Date:</span> 
                    <span class="value">${appointmentDate}</span>
                </div>
                <div class="appointment-detail">
                    <span class="label">Time:</span> 
                    <span class="value">${appointmentTime}</span>
                </div>
                <div class="appointment-detail">
                    <span class="label">Phone:</span> 
                    <span class="value">${phoneNumber || 'We will call you'}</span>
                </div>
            </div>
            
            <h3>What to Expect:</h3>
            <ul>
                <li>Free analysis of your current online presence</li>
                <li>Custom strategy to attract more customers</li>
                <li>Website optimization recommendations</li>
                <li>Lead generation opportunities for your business</li>
            </ul>
            
            <p>We will call you at the scheduled time. Please have any questions about your business goals ready.</p>
            
            <div class="footer">
                <p><strong>Atlas Growth</strong><br>
                Helping businesses grow through better websites and lead generation</p>
                <p>Contact: contact@atlasgrowth.ai</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                <p><strong>Your consultation will be handled by:</strong><br>
                ${personalInfo.name}<br>
                Phone: ${personalInfo.phone}<br>
                Email: ${personalInfo.email}</p>
            </div>
        </div>
    </body>
    </html>`;

    const msg = {
      to: ownerEmail,
      from: {
        email: 'contact@atlasgrowth.ai',
        name: 'Atlas Growth Team'
      },
      subject: `Your Atlas Growth Consultation - ${appointmentDate} at ${appointmentTime}`,
      html: emailHtml,
      text: `Hi ${ownerName || 'there'},

Your consultation with Atlas Growth is confirmed for ${appointmentDate} at ${appointmentTime}.

We'll call you at ${phoneNumber || 'your number'} to discuss how we can help ${companyName} grow online.

What to expect:
- Free analysis of your current online presence  
- Custom strategy to attract more customers
- Website optimization recommendations
- Lead generation opportunities

Questions? Reply to this email or contact us at contact@atlasgrowth.ai

Atlas Growth Team
atlasgrowth.ai`
    };

    await sgMail.send(msg);

    return res.status(200).json({
      success: true,
      message: 'Appointment confirmation email sent successfully'
    });

  } catch (error) {
    console.error('SendGrid error:', error);
    return res.status(500).json({
      error: 'Failed to send email',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}