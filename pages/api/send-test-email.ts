import { NextApiRequest, NextApiResponse } from 'next';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, text, html } = req.body;

    const msg = {
      to: to || 'nicksanford2341@gmail.com',
      from: 'contact@atlasgrowth.ai',
      subject: subject || 'Test Email from Atlas Growth',
      text: text || 'This is a test email from Atlas Growth to verify SendGrid integration.',
      html: html || `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Atlas Growth</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%); padding: 40px 30px; text-align: center;">
              <img src="https://atlasgrowth.ai/images/atlas-logo.jpeg" alt="Atlas Growth" style="max-height: 60px; width: auto; margin-bottom: 20px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">Welcome to Atlas Growth</h1>
              <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Your partner in digital growth</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Almost there! 🚀</h2>
              
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                We're testing our email system to ensure you receive important updates about your business website and dashboard access.
              </p>
              
              <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 30px 0; border-radius: 6px;">
                <p style="color: #0c4a6e; margin: 0; font-weight: 500;">
                  ✨ <strong>What's next:</strong> You'll receive secure login links to access your personalized business dashboard.
                </p>
              </div>
              
              <p style="color: #4b5563; line-height: 1.6; margin: 20px 0; font-size: 16px;">
                Questions? We're here to help! Contact us anytime.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://atlasgrowth.ai" style="background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(30, 64, 175, 0.4);">
                  Visit Atlas Growth →
                </a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <div style="margin-bottom: 15px;">
                <img src="https://atlasgrowth.ai/images/atlas-logo.jpeg" alt="Atlas Growth" style="max-height: 40px; width: auto; opacity: 0.7;">
              </div>
              
              <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px; font-weight: 500;">
                Atlas Growth
              </p>
              
              <p style="color: #9ca3af; margin: 0 0 15px 0; font-size: 14px;">
                📞 <a href="tel:205-500-5170" style="color: #1e40af; text-decoration: none;">205-500-5170</a><br>
                🌐 <a href="https://atlasgrowth.ai" style="color: #1e40af; text-decoration: none;">atlasgrowth.ai</a>
              </p>
              
              <p style="color: #9ca3af; margin: 0; font-size: 12px; line-height: 1.4;">
                This email was sent to test our integration.<br>
                Helping businesses grow with professional websites and digital solutions.
              </p>
            </div>
            
          </div>
        </body>
        </html>
      `
    };

    await sgMail.send(msg);

    res.status(200).json({ 
      success: true, 
      message: `Test email sent successfully to ${msg.to}` 
    });

  } catch (error: any) {
    console.error('SendGrid error:', error);
    
    // SendGrid specific error handling
    if (error.response) {
      console.error('SendGrid response error:', error.response.body);
      return res.status(400).json({ 
        error: 'SendGrid error', 
        details: error.response.body 
      });
    }

    res.status(500).json({ 
      error: 'Failed to send email', 
      details: error.message 
    });
  }
}