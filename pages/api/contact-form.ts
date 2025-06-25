import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, phone, email, message, companyName, companySlug } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }

  try {
    // TextGrid SMS API call
    const accountSid = process.env.TEXTGRID_ACCOUNT_SID;
    const authToken = process.env.TEXTGRID_AUTH_TOKEN;
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    
    // Target phone number (your number)
    const targetPhone = '2055005170';
    
    // From number - you'll need to set this up in Textgrid
    const fromNumber = process.env.TEXTGRID_FROM_NUMBER || '+12055005170';
    
    // Create the SMS message
    const smsMessage = `🔥 NEW LEAD from ${companyName}!

👤 Name: ${name}
📱 Phone: ${phone}
${email ? `📧 Email: ${email}` : ''}
${message ? `💬 Message: ${message}` : ''}

Company: ${companyName} (${companySlug})

Reply to this customer ASAP! 📞`;

    console.log(`📱 Sending SMS notification for new lead: ${name}`);
    
    const textGridResponse = await fetch(`https://api.textgrid.com/v1/accounts/${accountSid}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: targetPhone,
        Body: smsMessage
      })
    });

    console.log(`📡 TextGrid response status: ${textGridResponse.status}`);
    
    if (!textGridResponse.ok) {
      const errorData = await textGridResponse.text();
      console.error('TextGrid SMS error:', errorData);
      return res.status(500).json({ error: 'Failed to send SMS notification', details: errorData });
    }

    const smsData = await textGridResponse.text();
    console.log('📱 SMS sent successfully:', smsData);

    return res.status(200).json({
      success: true,
      message: 'Contact form submitted successfully and SMS notification sent'
    });

  } catch (error) {
    console.error('Contact form submission error:', error);
    return res.status(500).json({ 
      error: 'Failed to submit contact form',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}