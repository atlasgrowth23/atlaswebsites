import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      CallSid,
      CallStatus,
      CallDuration,
      From,
      To,
      Direction,
      AnsweredBy,
      RecordingUrl
    } = req.body;

    console.log('📞 TextGrid Call Status Update:', {
      callSid: CallSid,
      status: CallStatus,
      duration: CallDuration,
      from: From,
      to: To,
      direction: Direction,
      answeredBy: AnsweredBy,
      recordingUrl: RecordingUrl
    });

    // TODO: Update database with call status
    // - Log call outcome (answered, no-answer, busy, failed)
    // - Update lead's last_contact_date if answered
    // - Increment call_attempts_count
    // - Store recording URL if available

    // For now, just log the status
    const statusMessages = {
      'ringing': '📱 Phone is ringing...',
      'in-progress': '📞 Call connected!',
      'completed': '✅ Call completed',
      'busy': '📵 Line busy',
      'no-answer': '📭 No answer',
      'failed': '❌ Call failed',
      'canceled': '🚫 Call canceled'
    };

    const message = statusMessages[CallStatus as keyof typeof statusMessages] || `Status: ${CallStatus}`;
    console.log(`Call ${CallSid}: ${message}`);

    // Respond with TwiML if needed
    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send('<Response></Response>');

  } catch (error) {
    console.error('Status callback error:', error);
    res.status(200).send('<Response></Response>'); // Always return 200 to TextGrid
  }
}