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

    // Get the uploaded logo URL from Supabase Storage
    const logoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/email-assets/atlas-logo.jpeg`;

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
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
            .logo { max-width: 150px; height: auto; margin-bottom: 20px; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .appointment-box { background: #f8f9ff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .appointment-detail { margin: 10px 0; font-size: 16px; }
            .label { font-weight: bold; color: #333; }
            .value { color: #667eea; font-weight: 600; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
            .cta-button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="${logoUrl}" alt="Atlas Growth" class="logo">
                <h1>Your Consultation is Confirmed!</h1>
            </div>
            
            <div class="content">
                <p>Hi ${ownerName || 'there'},</p>
                
                <p>Thank you for scheduling a consultation with Atlas Growth! We're excited to help <strong>${companyName}</strong> grow its online presence and generate more leads.</p>
                
                <div class="appointment-box">
                    <h3 style="margin-top: 0; color: #333;">📅 Appointment Details</h3>
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
                        <span class="value">${phoneNumber || 'We\'ll call you'}</span>
                    </div>
                </div>
                
                <h3>What to Expect:</h3>
                <ul>
                    <li>📊 Free analysis of your current online presence</li>
                    <li>🎯 Custom strategy to attract more customers</li>
                    <li>💡 Website optimization recommendations</li>
                    <li>📈 Lead generation opportunities specific to your business</li>
                </ul>
                
                <p>Our team will call you at the scheduled time. Please have any questions about your business goals ready!</p>
                
                <a href="mailto:contact@atlasgrowth.ai" class="cta-button">Questions? Contact Us</a>
            </div>
            
            <div class="footer">
                <p><strong>Atlas Growth</strong><br>
                Helping businesses grow through better websites and lead generation</p>
                <p>📧 contact@atlasgrowth.ai | 🌐 atlasgrowth.ai</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                <p><strong>Your consultation will be handled by:</strong><br>
                ${personalInfo.name}<br>
                📞 ${personalInfo.phone}<br>
                📧 ${personalInfo.email}</p>
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