import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { leadPhone, fromNumber, leadName, leadId } = req.body;

  if (!leadPhone || !fromNumber) {
    return res.status(400).json({ error: 'Missing required fields: leadPhone, fromNumber' });
  }

  try {
    // TextGrid API call to initiate outbound call
    const accountSid = process.env.TEXTGRID_ACCOUNT_SID;
    const authToken = process.env.TEXTGRID_AUTH_TOKEN;
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    
    const textGridResponse = await fetch(`https://api.textgrid.com/2010-04-01/Accounts/${accountSid}/Calls.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: leadPhone,
        Url: `https://atlasgrowth.ai/api/textgrid/voice-twiml`,
        StatusCallback: `https://atlasgrowth.ai/api/textgrid/status-callback`,
        StatusCallbackMethod: 'POST'
      })
    });

    if (!textGridResponse.ok) {
      const errorData = await textGridResponse.text();
      console.error('TextGrid API error:', errorData);
      return res.status(500).json({ error: 'Failed to initiate call', details: errorData });
    }

    const callData = await textGridResponse.json();
    
    // Log call attempt in database
    try {
      // TODO: Add database logging here
      console.log(`📞 Call initiated - Lead: ${leadName} (${leadPhone}), From: ${fromNumber}, Call SID: ${callData.sid}`);
    } catch (dbError) {
      console.error('Database logging error:', dbError);
      // Don't fail the API call if logging fails
    }

    return res.status(200).json({
      success: true,
      callSid: callData.sid,
      status: callData.status,
      message: `Call initiated to ${leadName} (${leadPhone})`
    });

  } catch (error) {
    console.error('TextGrid call error:', error);
    return res.status(500).json({ 
      error: 'Failed to make call',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}