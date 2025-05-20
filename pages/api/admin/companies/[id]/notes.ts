import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { id } = req.query;
  const { notes } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: 'Missing company ID' });
  }
  
  try {
    // Update the company's notes
    await query(`
      UPDATE companies 
      SET notes = $1
      WHERE id = $2
    `, [notes, id]);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating company notes:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}