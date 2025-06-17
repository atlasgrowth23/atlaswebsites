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
    
    // Clean phone numbers (remove spaces and formatting)
    const cleanLeadPhone = leadPhone.replace(/[\s\-\(\)]/g, '');
    const cleanFromNumber = fromNumber.replace(/[\s\-\(\)]/g, '');
    
    console.log(`🔍 Making call with Account SID: ${accountSid}, From: ${cleanFromNumber}, To: ${cleanLeadPhone}`);
    console.log(`📡 URL: https://api.textgrid.com/v1/accounts/${accountSid}/calls`);
    
    const textGridResponse = await fetch(`https://api.textgrid.com/v1/accounts/${accountSid}/calls`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: cleanFromNumber,
        To: cleanLeadPhone,
        Url: `https://ecff9f9a-4730-4865-9bc1-4171f6a31017-00-27datk18aao4y.picard.replit.dev/api/textgrid/voice-twiml`,
        StatusCallback: `https://ecff9f9a-4730-4865-9bc1-4171f6a31017-00-27datk18aao4y.picard.replit.dev/api/textgrid/status-callback`,
        StatusCallbackMethod: 'POST'
      })
    });

    console.log(`📊 Response status: ${textGridResponse.status}`);
    
    if (!textGridResponse.ok) {
      const errorData = await textGridResponse.text();
      console.error('TextGrid API error:', errorData);
      console.error('Response headers:', Object.fromEntries(textGridResponse.headers.entries()));
      return res.status(500).json({ error: 'Failed to initiate call', details: errorData });
    }

    const callData = await textGridResponse.text();
    console.log('📞 TextGrid response:', callData);
    
    // Log call attempt in database
    try {
      // TODO: Add database logging here
      console.log(`📞 Call initiated - Lead: ${leadName} (${leadPhone}), From: ${cleanFromNumber}`);
    } catch (dbError) {
      console.error('Database logging error:', dbError);
      // Don't fail the API call if logging fails
    }

    return res.status(200).json({
      success: true,
      response: callData,
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