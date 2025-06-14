import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      MessageSid,
      From,
      To,
      Body,
      MessageStatus,
      NumMedia
    } = req.body;

    console.log('📱 SMS Callback:', {
      messageSid: MessageSid,
      from: From,
      to: To,
      body: Body,
      status: MessageStatus,
      numMedia: NumMedia
    });

    // TODO: Handle incoming SMS
    // - Check if From number matches any leads
    // - Log response in pipeline system
    // - Auto-respond if needed
    // - Update lead status based on response

    // For now, just log the message
    console.log(`SMS from ${From}: "${Body}"`);

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('SMS callback error:', error);
    res.status(200).json({ success: true }); // Always return success to TextGrid
  }
}