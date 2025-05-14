import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        // Get activities with optional filtering
        const { 
          leadId, 
          userId,
          activityType,
          startDate,
          endDate,
          completed,
          page = 1, 
          limit = 20 
        } = req.query;
        
        // Calculate offset for pagination
        const offset = (Number(page) - 1) * Number(limit);
        
        // Build the WHERE clause for filtering
        let whereConditions = [];
        let queryParams = [];
        let paramIndex = 1;
        
        if (leadId) {
          whereConditions.push(`sa.lead_id = $${paramIndex++}`);
          queryParams.push(leadId);
        }
        
        if (userId) {
          whereConditions.push(`sa.user_id = $${paramIndex++}`);
          queryParams.push(userId);
        }
        
        if (activityType) {
          whereConditions.push(`sa.activity_type = $${paramIndex++}`);
          queryParams.push(activityType);
        }
        
        if (startDate) {
          whereConditions.push(`sa.activity_date >= $${paramIndex++}`);
          queryParams.push(startDate);
        }
        
        if (endDate) {
          whereConditions.push(`sa.activity_date <= $${paramIndex++}`);
          queryParams.push(endDate);
        }
        
        if (completed !== undefined) {
          whereConditions.push(`sa.completed = $${paramIndex++}`);
          queryParams.push(completed === 'true');
        }
        
        // Construct the complete WHERE clause
        const whereClause = whereConditions.length > 0 
          ? `WHERE ${whereConditions.join(' AND ')}` 
          : '';
        
        // Construct the full query with JOINs to get related data
        const activitiesQuery = `
          SELECT sa.*,
                 su.name as user_name,
                 sl.company_id,
                 c.name as company_name
          FROM sales_activities sa
          LEFT JOIN sales_users su ON sa.user_id = su.id
          JOIN sales_leads sl ON sa.lead_id = sl.id
          JOIN companies c ON sl.company_id = c.id
          ${whereClause}
          ORDER BY sa.activity_date DESC
          LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;
        
        // Add pagination parameters
        queryParams.push(limit);
        queryParams.push(offset);
        
        // Get total count for pagination
        const countQuery = `
          SELECT COUNT(*) 
          FROM sales_activities sa
          ${whereClause}
        `;
        
        // Execute both queries
        const [activitiesResult, countResult] = await Promise.all([
          query(activitiesQuery, queryParams),
          query(countQuery, queryParams.slice(0, -2)) // Remove the LIMIT and OFFSET params
        ]);
        
        // Prepare the response with pagination info
        const totalCount = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalCount / Number(limit));
        
        return res.status(200).json({
          data: activitiesResult.rows,
          pagination: {
            total: totalCount,
            page: Number(page),
            limit: Number(limit),
            totalPages
          }
        });

      case 'POST':
        // Create a new activity
        const { 
          lead_id, 
          user_id, 
          activity_type, 
          activity_date,
          description, 
          outcome,
          scheduled_at,
          completed,
          notes
        } = req.body;
        
        if (!lead_id || !activity_type) {
          return res.status(400).json({ error: 'Lead ID and activity type are required' });
        }
        
        // Check if lead exists
        const leadExists = await query('SELECT id FROM sales_leads WHERE id = $1', [lead_id]);
        
        if (leadExists.rows.length === 0) {
          return res.status(404).json({ error: 'Lead not found' });
        }
        
        // Create the activity
        const newActivity = await query(
          `INSERT INTO sales_activities 
           (lead_id, user_id, activity_type, activity_date, description, outcome, scheduled_at, completed, notes) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
           RETURNING *`,
          [
            lead_id,
            user_id || null,
            activity_type,
            activity_date ? new Date(activity_date) : new Date(),
            description || null,
            outcome || null,
            scheduled_at ? new Date(scheduled_at) : null,
            completed || false,
            notes || null
          ]
        );
        
        // If this is a completed activity, update the lead's last_contact_date
        if (completed) {
          await query(
            'UPDATE sales_leads SET last_contact_date = $1 WHERE id = $2',
            [activity_date ? new Date(activity_date) : new Date(), lead_id]
          );
        }
        
        return res.status(201).json(newActivity.rows[0]);

      case 'PUT':
        // Update an activity
        const { id, ...activityUpdateData } = req.body;
        
        if (!id) {
          return res.status(400).json({ error: 'Activity ID is required' });
        }
        
        // Check if activity exists
        const activityCheck = await query('SELECT id, lead_id FROM sales_activities WHERE id = $1', [id]);
        
        if (activityCheck.rows.length === 0) {
          return res.status(404).json({ error: 'Activity not found' });
        }
        
        // Build the SET clause for dynamic updates
        const updateFields = [];
        const updateValues = [id]; // First param is the activity ID
        let updateIndex = 2;
        
        // Handle each possible update field
        if ('user_id' in activityUpdateData) {
          updateFields.push(`user_id = $${updateIndex++}`);
          updateValues.push(activityUpdateData.user_id);
        }
        
        if ('activity_type' in activityUpdateData) {
          updateFields.push(`activity_type = $${updateIndex++}`);
          updateValues.push(activityUpdateData.activity_type);
        }
        
        if ('activity_date' in activityUpdateData) {
          updateFields.push(`activity_date = $${updateIndex++}`);
          updateValues.push(activityUpdateData.activity_date ? new Date(activityUpdateData.activity_date) : null);
        }
        
        if ('description' in activityUpdateData) {
          updateFields.push(`description = $${updateIndex++}`);
          updateValues.push(activityUpdateData.description);
        }
        
        if ('outcome' in activityUpdateData) {
          updateFields.push(`outcome = $${updateIndex++}`);
          updateValues.push(activityUpdateData.outcome);
        }
        
        if ('scheduled_at' in activityUpdateData) {
          updateFields.push(`scheduled_at = $${updateIndex++}`);
          updateValues.push(activityUpdateData.scheduled_at ? new Date(activityUpdateData.scheduled_at) : null);
        }
        
        if ('completed' in activityUpdateData) {
          updateFields.push(`completed = $${updateIndex++}`);
          updateValues.push(activityUpdateData.completed);
        }
        
        if ('notes' in activityUpdateData) {
          updateFields.push(`notes = $${updateIndex++}`);
          updateValues.push(activityUpdateData.notes);
        }
        
        // If no fields to update, return an error
        if (updateFields.length === 0) {
          return res.status(400).json({ error: 'No update data provided' });
        }
        
        // Construct and execute the update query
        const activityUpdateQuery = `
          UPDATE sales_activities
          SET ${updateFields.join(', ')}
          WHERE id = $1
          RETURNING *
        `;
        
        const updatedActivity = await query(activityUpdateQuery, updateValues);
        
        // If this is being marked as completed, update the lead's last_contact_date
        if (activityUpdateData.completed === true) {
          const leadId = activityCheck.rows[0].lead_id;
          await query(
            'UPDATE sales_leads SET last_contact_date = $1 WHERE id = $2',
            [
              activityUpdateData.activity_date ? new Date(activityUpdateData.activity_date) : new Date(),
              leadId
            ]
          );
        }
        
        return res.status(200).json(updatedActivity.rows[0]);

      case 'DELETE':
        // Delete an activity
        const { activityId } = req.query;
        
        if (!activityId) {
          return res.status(400).json({ error: 'Activity ID is required' });
        }
        
        // Check if activity exists
        const deleteActivityCheck = await query('SELECT id FROM sales_activities WHERE id = $1', [activityId]);
        
        if (deleteActivityCheck.rows.length === 0) {
          return res.status(404).json({ error: 'Activity not found' });
        }
        
        // Delete the activity
        await query('DELETE FROM sales_activities WHERE id = $1', [activityId]);
        
        return res.status(200).json({ message: 'Activity deleted successfully' });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Error handling sales activities request:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}