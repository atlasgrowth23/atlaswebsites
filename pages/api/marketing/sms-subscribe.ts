import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone } = req.body;

  if (!phone || phone.length < 10) {
    return res.status(400).json({ error: 'Valid phone number required' });
  }

  try {
    // Clean phone number (remove non-digits)
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Ensure US format
    const formattedPhone = cleanPhone.length === 10 ? `+1${cleanPhone}` : `+${cleanPhone}`;

    // Here you would integrate with Twilio or your SMS service
    // Example Twilio integration:
    
    // const twilio = require('twilio');
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    // await client.messages.create({
    //   body: 'Welcome to Atlas Growth! You\'ll receive helpful tips on generating more customers through Google reviews and feedback. Reply STOP to unsubscribe.',
    //   from: process.env.TWILIO_PHONE_NUMBER, // Your Twilio phone number
    //   to: formattedPhone
    // });

    // For now, just log it (replace with real SMS service)
    console.log(`New SMS subscription: ${formattedPhone}`);
    
    // Save to database for compliance tracking
    // const { createClient } = require('@supabase/supabase-js');
    // const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    // await supabase.from('sms_subscriptions').insert({ 
    //   phone: formattedPhone, 
    //   opted_in: true,
    //   source: 'marketing_page',
    //   created_at: new Date() 
    // });

    res.status(200).json({ 
      success: true, 
      message: 'SMS subscription successful',
      phone: formattedPhone 
    });
  } catch (error) {
    console.error('SMS subscription error:', error);
    res.status(500).json({ error: 'SMS subscription failed' });
  }
}