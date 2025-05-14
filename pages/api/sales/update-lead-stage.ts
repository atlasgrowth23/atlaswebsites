import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';

interface UpdateLeadStageRequest {
  leadId: number;
  stageId: number;
  userId: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    const { leadId, stageId, userId } = req.body as UpdateLeadStageRequest;
    
    if (!leadId || !stageId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Update the lead's stage
    const updateResult = await query(
      'UPDATE sales_leads SET stage_id = $1, updated_at = NOW() WHERE id = $2 RETURNING id',
      [stageId, leadId]
    );
    
    if (updateResult.rowCount === 0) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    
    // Add activity log entry if we have a user ID
    if (userId) {
      // Get the stage name for the activity log
      const stageResult = await query(
        'SELECT name FROM pipeline_stages WHERE id = $1',
        [stageId]
      );
      
      const stageName = stageResult.rows[0]?.name || 'Unknown Stage';
      
      // Add the activity
      await query(
        `INSERT INTO sales_activities (
          lead_id, 
          type, 
          notes, 
          created_by
        ) VALUES ($1, $2, $3, $4)`,
        [leadId, 'stage_change', `Stage changed to "${stageName}"`, userId]
      );
    }
    
    return res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Error updating lead stage:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}