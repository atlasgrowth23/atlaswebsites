import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('📞 Voice Fallback triggered:', req.body);
  
  // Fallback endpoint - called if main voice callback fails
  res.setHeader('Content-Type', 'application/xml');
  res.status(200).send(`
    <Response>
      <Say>We're experiencing technical difficulties. Please try again later.</Say>
    </Response>
  `);
}