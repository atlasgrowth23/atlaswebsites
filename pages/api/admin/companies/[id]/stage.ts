import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { id } = req.query;
  const { stage } = req.body;
  
  if (!id || !stage) {
    return res.status(400).json({ error: 'Missing company ID or pipeline stage' });
  }
  
  const validStages = ['prospect', 'contacted', 'meeting', 'proposal', 'negotiation', 'closed'];
  if (!validStages.includes(stage)) {
    return res.status(400).json({ error: 'Invalid pipeline stage' });
  }
  
  try {
    // Update the company's pipeline stage and record the last contact date
    await query(`
      UPDATE companies 
      SET 
        pipeline_stage = $1, 
        last_contact_date = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [stage, id]);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating company pipeline stage:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}