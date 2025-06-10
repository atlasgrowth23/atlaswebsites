import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  try {
    // Here you would integrate with your email service
    // Examples:
    
    // ConvertKit
    // await fetch('https://api.convertkit.com/v3/forms/YOUR_FORM_ID/subscribe', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     api_key: process.env.CONVERTKIT_API_KEY,
    //     email: email
    //   })
    // });

    // Mailchimp
    // await fetch(`https://us1.api.mailchimp.com/3.0/lists/YOUR_LIST_ID/members`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.MAILCHIMP_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     email_address: email,
    //     status: 'subscribed'
    //   })
    // });

    // For now, just log it (replace with real email service)
    console.log(`New marketing subscription: ${email}`);
    
    // You could also save to your database
    // const { createClient } = require('@supabase/supabase-js');
    // const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    // await supabase.from('marketing_subscriptions').insert({ email, created_at: new Date() });

    res.status(200).json({ success: true, message: 'Subscription successful' });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ error: 'Subscription failed' });
  }
}