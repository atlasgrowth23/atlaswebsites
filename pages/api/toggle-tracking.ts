import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Temporarily disabled for Supabase migration
  return res.status(200).json({ 
    success: true, 
    message: 'Tracking functionality temporarily disabled during migration' 
  });
}