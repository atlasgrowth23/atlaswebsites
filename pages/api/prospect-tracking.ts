import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Temporarily disabled for Supabase migration
  return res.status(200).json({ 
    success: true, 
    message: 'Prospect tracking temporarily disabled during migration' 
  });
}