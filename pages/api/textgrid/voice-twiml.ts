import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      CallSid,
      From,
      To,
      Direction,
      CallerName
    } = req.body;

    console.log('📞 TwiML Request:', {
      callSid: CallSid,
      from: From,
      to: To,
      direction: Direction,
      callerName: CallerName
    });

    // Return TwiML to forward the call to your actual phone
    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! You're being connected to Atlas Growth. Please hold.</Say>
    <Dial timeout="30" record="record-from-ringing">
        <Number>+12050051700</Number>
    </Dial>
    <Say voice="alice">Sorry, we're not available right now. Please leave a message after the beep.</Say>
    <Record timeout="60" transcribe="true" />
</Response>`);

  } catch (error) {
    console.error('TwiML error:', error);
    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Sorry, there was an error processing your call.</Say>
</Response>`);
  }
}