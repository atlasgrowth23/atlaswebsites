import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        // Get all pipeline stages ordered by order_num
        const stages = await query('SELECT * FROM pipeline_stages ORDER BY order_num');
        return res.status(200).json(stages.rows);

      case 'POST':
        // Create a new pipeline stage
        const { name, description, order_num, color } = req.body;
        
        if (!name || order_num === undefined) {
          return res.status(400).json({ error: 'Name and order_num are required' });
        }
        
        // Get the maximum order_num to place new stage at the end if not specified
        let targetOrderNum = order_num;
        if (targetOrderNum === undefined) {
          const maxOrderResult = await query('SELECT MAX(order_num) FROM pipeline_stages');
          targetOrderNum = (maxOrderResult.rows[0].max || 0) + 1;
        }
        
        // Create the stage
        const newStage = await query(
          'INSERT INTO pipeline_stages (name, description, order_num, color) VALUES ($1, $2, $3, $4) RETURNING *',
          [name, description || null, targetOrderNum, color || null]
        );
        
        return res.status(201).json(newStage.rows[0]);

      case 'PUT':
        // Update a pipeline stage
        const { id, ...updateData } = req.body;
        
        if (!id) {
          return res.status(400).json({ error: 'Stage ID is required' });
        }
        
        // Check if the stage exists
        const stageCheck = await query('SELECT id FROM pipeline_stages WHERE id = $1', [id]);
        
        if (stageCheck.rows.length === 0) {
          return res.status(404).json({ error: 'Pipeline stage not found' });
        }
        
        // Build the SET clause for dynamic updates
        const updateFields = [];
        const updateValues = [id]; // First param is the stage ID
        let updateIndex = 2;
        
        // Handle each possible update field
        if ('name' in updateData) {
          updateFields.push(`name = $${updateIndex++}`);
          updateValues.push(updateData.name);
        }
        
        if ('description' in updateData) {
          updateFields.push(`description = $${updateIndex++}`);
          updateValues.push(updateData.description);
        }
        
        if ('order_num' in updateData) {
          updateFields.push(`order_num = $${updateIndex++}`);
          updateValues.push(updateData.order_num);
        }
        
        if ('color' in updateData) {
          updateFields.push(`color = $${updateIndex++}`);
          updateValues.push(updateData.color);
        }
        
        // If no fields to update, return an error
        if (updateFields.length === 0) {
          return res.status(400).json({ error: 'No update data provided' });
        }
        
        // Construct and execute the update query
        const stageUpdateQuery = `
          UPDATE pipeline_stages
          SET ${updateFields.join(', ')}
          WHERE id = $1
          RETURNING *
        `;
        
        const updatedStage = await query(stageUpdateQuery, updateValues);
        
        return res.status(200).json(updatedStage.rows[0]);

      case 'DELETE':
        // Delete a pipeline stage
        const { stageId } = req.query;
        
        if (!stageId) {
          return res.status(400).json({ error: 'Stage ID is required' });
        }
        
        // Check if stage exists
        const deleteStageCheck = await query('SELECT id FROM pipeline_stages WHERE id = $1', [stageId]);
        
        if (deleteStageCheck.rows.length === 0) {
          return res.status(404).json({ error: 'Pipeline stage not found' });
        }
        
        // Check if there are any leads using this stage
        const leadsUsingStage = await query('SELECT COUNT(*) FROM sales_leads WHERE stage_id = $1', [stageId]);
        
        if (parseInt(leadsUsingStage.rows[0].count) > 0) {
          return res.status(409).json({ 
            error: 'Cannot delete stage that has leads. Move leads to another stage first.',
            leadsCount: parseInt(leadsUsingStage.rows[0].count)
          });
        }
        
        // Delete the stage
        await query('DELETE FROM pipeline_stages WHERE id = $1', [stageId]);
        
        return res.status(200).json({ message: 'Pipeline stage deleted successfully' });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Error handling pipeline stages request:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}