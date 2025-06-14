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
      CallerName,
      CallStatus
    } = req.body;

    console.log('📞 Incoming Voice Callback:', {
      callSid: CallSid,
      from: From,
      to: To,
      direction: Direction,
      callerName: CallerName,
      status: CallStatus
    });

    // This handles incoming calls to your TextGrid number
    // The call will auto-forward based on your TextGrid settings

    // TODO: Log incoming call in database
    // - Check if From number matches any leads
    // - Log as callback/return call if found
    // - Update lead status if this is a callback

    // Respond with TwiML to handle the call - forward to your phone
    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(`
      <Response>
        <Say>Atlas Growth, please hold while we connect you.</Say>
        <Dial timeout="30" record="record-from-ringing">
          <Number>+12050051700</Number>
        </Dial>
        <Say>Sorry, we're not available right now. Please leave a message after the beep.</Say>
        <Record timeout="60" transcribe="true" />
      </Response>
    `);

  } catch (error) {
    console.error('Voice callback error:', error);
    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send('<Response></Response>');
  }
}