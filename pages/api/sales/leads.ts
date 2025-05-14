import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        // Get leads with optional filtering
        const { 
          userId, 
          stageId, 
          status,
          territory,
          page = 1, 
          limit = 50,
          sort = 'created_at',
          order = 'desc'
        } = req.query;
        
        // Calculate offset for pagination
        const offset = (Number(page) - 1) * Number(limit);
        
        // Build the WHERE clause for filtering
        let whereConditions = [];
        let queryParams = [];
        let paramIndex = 1;
        
        if (userId) {
          whereConditions.push(`sl.assigned_to = $${paramIndex++}`);
          queryParams.push(userId);
        }
        
        if (stageId) {
          whereConditions.push(`sl.stage_id = $${paramIndex++}`);
          queryParams.push(stageId);
        }
        
        if (status) {
          whereConditions.push(`sl.status = $${paramIndex++}`);
          queryParams.push(status);
        }
        
        if (territory) {
          whereConditions.push(`c.state = $${paramIndex++}`);
          queryParams.push(territory);
        }
        
        // Construct the complete WHERE clause
        const whereClause = whereConditions.length > 0 
          ? `WHERE ${whereConditions.join(' AND ')}` 
          : '';
        
        // Construct the full query with JOIN to get company details
        const leadsQuery = `
          SELECT sl.*, 
                 c.name as company_name, 
                 c.phone, 
                 c.state, 
                 c.city,
                 c.place_id,
                 c.reviews,
                 c.rating,
                 ps.name as stage_name,
                 ps.color as stage_color,
                 su.name as assigned_to_name
          FROM sales_leads sl
          JOIN companies c ON sl.company_id = c.id
          LEFT JOIN pipeline_stages ps ON sl.stage_id = ps.id
          LEFT JOIN sales_users su ON sl.assigned_to = su.id
          ${whereClause}
          ORDER BY ${sort} ${order}
          LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;
        
        // Add pagination parameters
        queryParams.push(limit);
        queryParams.push(offset);
        
        // Get total count for pagination
        const countQuery = `
          SELECT COUNT(*) 
          FROM sales_leads sl
          JOIN companies c ON sl.company_id = c.id
          ${whereClause}
        `;
        
        // Execute both queries
        const [leadsResult, countResult] = await Promise.all([
          query(leadsQuery, queryParams),
          query(countQuery, queryParams.slice(0, -2)) // Remove the LIMIT and OFFSET params
        ]);
        
        // Prepare the response with pagination info
        const totalCount = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalCount / Number(limit));
        
        return res.status(200).json({
          data: leadsResult.rows,
          pagination: {
            total: totalCount,
            page: Number(page),
            limit: Number(limit),
            totalPages
          }
        });

      case 'POST':
        // Create a new lead
        const { company_id, assigned_to, stage_id, status, priority, next_follow_up, notes } = req.body;
        
        if (!company_id) {
          return res.status(400).json({ error: 'Company ID is required' });
        }
        
        // Check if company exists
        const companyExists = await query('SELECT id FROM companies WHERE id = $1', [company_id]);
        
        if (companyExists.rows.length === 0) {
          return res.status(404).json({ error: 'Company not found' });
        }
        
        // Check if lead already exists for this company
        const leadExists = await query('SELECT id FROM sales_leads WHERE company_id = $1', [company_id]);
        
        if (leadExists.rows.length > 0) {
          return res.status(409).json({ 
            error: 'Lead already exists for this company',
            leadId: leadExists.rows[0].id
          });
        }
        
        // Get the first stage if none provided
        let targetStageId = stage_id;
        if (!targetStageId) {
          const firstStage = await query('SELECT id FROM pipeline_stages ORDER BY order_num LIMIT 1');
          if (firstStage.rows.length > 0) {
            targetStageId = firstStage.rows[0].id;
          }
        }
        
        // Create the lead
        const newLead = await query(
          `INSERT INTO sales_leads 
           (company_id, assigned_to, stage_id, status, priority, next_follow_up, notes) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) 
           RETURNING *`,
          [
            company_id, 
            assigned_to || null, 
            targetStageId || null, 
            status || 'new', 
            priority || 3,
            next_follow_up ? new Date(next_follow_up) : null,
            notes || null
          ]
        );
        
        return res.status(201).json(newLead.rows[0]);

      case 'PUT':
        // Update a lead
        const { id: leadId, ...leadUpdateData } = req.body;
        
        if (!leadId) {
          return res.status(400).json({ error: 'Lead ID is required' });
        }
        
        // Check if lead exists
        const leadCheck = await query('SELECT id FROM sales_leads WHERE id = $1', [leadId]);
        
        if (leadCheck.rows.length === 0) {
          return res.status(404).json({ error: 'Lead not found' });
        }
        
        // Build the SET clause for dynamic updates
        const updateFields = [];
        const updateValues = [leadId]; // First param is the lead ID
        let updateIndex = 2;
        
        // Handle each possible update field
        if ('assigned_to' in leadUpdateData) {
          updateFields.push(`assigned_to = $${updateIndex++}`);
          updateValues.push(leadUpdateData.assigned_to);
        }
        
        if ('stage_id' in leadUpdateData) {
          updateFields.push(`stage_id = $${updateIndex++}`);
          updateValues.push(leadUpdateData.stage_id);
        }
        
        if ('status' in leadUpdateData) {
          updateFields.push(`status = $${updateIndex++}`);
          updateValues.push(leadUpdateData.status);
        }
        
        if ('priority' in leadUpdateData) {
          updateFields.push(`priority = $${updateIndex++}`);
          updateValues.push(leadUpdateData.priority);
        }
        
        if ('next_follow_up' in leadUpdateData) {
          updateFields.push(`next_follow_up = $${updateIndex++}`);
          updateValues.push(leadUpdateData.next_follow_up ? new Date(leadUpdateData.next_follow_up) : null);
        }
        
        if ('notes' in leadUpdateData) {
          updateFields.push(`notes = $${updateIndex++}`);
          updateValues.push(leadUpdateData.notes);
        }
        
        // Add updated_at timestamp
        updateFields.push(`updated_at = NOW()`);
        
        // If no fields to update, return an error
        if (updateFields.length === 0) {
          return res.status(400).json({ error: 'No update data provided' });
        }
        
        // Construct and execute the update query
        const leadUpdateQuery = `
          UPDATE sales_leads
          SET ${updateFields.join(', ')}
          WHERE id = $1
          RETURNING *
        `;
        
        const updatedLead = await query(leadUpdateQuery, updateValues);
        
        return res.status(200).json(updatedLead.rows[0]);

      case 'DELETE':
        // Delete a lead
        const { leadId: deleteLeadId } = req.query;
        
        if (!deleteLeadId) {
          return res.status(400).json({ error: 'Lead ID is required' });
        }
        
        // Check if lead exists
        const deleteLeadCheck = await query('SELECT id FROM sales_leads WHERE id = $1', [deleteLeadId]);
        
        if (deleteLeadCheck.rows.length === 0) {
          return res.status(404).json({ error: 'Lead not found' });
        }
        
        // Delete the lead
        await query('DELETE FROM sales_leads WHERE id = $1', [deleteLeadId]);
        
        return res.status(200).json({ message: 'Lead deleted successfully' });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Error handling sales leads request:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}