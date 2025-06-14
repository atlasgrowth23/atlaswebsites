import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('📱 SMS Fallback triggered:', req.body);
  
  // Fallback endpoint - called if main SMS callback fails
  res.status(200).json({ success: true });
}