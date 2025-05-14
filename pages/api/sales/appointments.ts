import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        // Get appointments with optional filtering
        const { 
          leadId, 
          userId,
          status,
          startDate,
          endDate,
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
        
        if (status) {
          whereConditions.push(`sa.status = $${paramIndex++}`);
          queryParams.push(status);
        }
        
        if (startDate) {
          whereConditions.push(`sa.appointment_date >= $${paramIndex++}`);
          queryParams.push(startDate);
        }
        
        if (endDate) {
          whereConditions.push(`sa.appointment_date <= $${paramIndex++}`);
          queryParams.push(endDate);
        }
        
        // Construct the complete WHERE clause
        const whereClause = whereConditions.length > 0 
          ? `WHERE ${whereConditions.join(' AND ')}` 
          : '';
        
        // Construct the full query with JOINs to get related data
        const appointmentsQuery = `
          SELECT sa.*,
                 su.name as user_name,
                 sl.company_id,
                 c.name as company_name,
                 c.address as company_address,
                 c.phone as company_phone,
                 c.city as company_city,
                 c.state as company_state
          FROM sales_appointments sa
          LEFT JOIN sales_users su ON sa.user_id = su.id
          JOIN sales_leads sl ON sa.lead_id = sl.id
          JOIN companies c ON sl.company_id = c.id
          ${whereClause}
          ORDER BY sa.appointment_date ASC
          LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;
        
        // Add pagination parameters
        queryParams.push(limit);
        queryParams.push(offset);
        
        // Get total count for pagination
        const countQuery = `
          SELECT COUNT(*) 
          FROM sales_appointments sa
          ${whereClause}
        `;
        
        // Execute both queries
        const [appointmentsResult, countResult] = await Promise.all([
          query(appointmentsQuery, queryParams),
          query(countQuery, queryParams.slice(0, -2)) // Remove the LIMIT and OFFSET params
        ]);
        
        // Prepare the response with pagination info
        const totalCount = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalCount / Number(limit));
        
        return res.status(200).json({
          data: appointmentsResult.rows,
          pagination: {
            total: totalCount,
            page: Number(page),
            limit: Number(limit),
            totalPages
          }
        });

      case 'POST':
        // Create a new appointment
        const { 
          lead_id, 
          user_id, 
          title,
          description,
          appointment_date,
          duration_minutes,
          location,
          status,
          notes
        } = req.body;
        
        if (!lead_id || !title || !appointment_date) {
          return res.status(400).json({ error: 'Lead ID, title, and appointment date are required' });
        }
        
        // Check if lead exists
        const leadExists = await query('SELECT id FROM sales_leads WHERE id = $1', [lead_id]);
        
        if (leadExists.rows.length === 0) {
          return res.status(404).json({ error: 'Lead not found' });
        }
        
        // Create the appointment
        const newAppointment = await query(
          `INSERT INTO sales_appointments 
           (lead_id, user_id, title, description, appointment_date, duration_minutes, location, status, notes) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
           RETURNING *`,
          [
            lead_id,
            user_id || null,
            title,
            description || null,
            new Date(appointment_date),
            duration_minutes || 60,
            location || null,
            status || 'scheduled',
            notes || null
          ]
        );
        
        // Also create an activity for this appointment
        await query(
          `INSERT INTO sales_activities 
           (lead_id, user_id, activity_type, description, scheduled_at) 
           VALUES ($1, $2, $3, $4, $5)`,
          [
            lead_id,
            user_id || null,
            'appointment',
            `Appointment: ${title}`,
            new Date(appointment_date)
          ]
        );
        
        // Update the lead's next_follow_up date if it's not set or if this appointment is earlier
        await query(
          `UPDATE sales_leads 
           SET next_follow_up = $1 
           WHERE id = $2 AND (next_follow_up IS NULL OR next_follow_up > $1)`,
          [new Date(appointment_date), lead_id]
        );
        
        return res.status(201).json(newAppointment.rows[0]);

      case 'PUT':
        // Update an appointment
        const { id, ...appointmentUpdateData } = req.body;
        
        if (!id) {
          return res.status(400).json({ error: 'Appointment ID is required' });
        }
        
        // Check if appointment exists
        const appointmentCheck = await query('SELECT id FROM sales_appointments WHERE id = $1', [id]);
        
        if (appointmentCheck.rows.length === 0) {
          return res.status(404).json({ error: 'Appointment not found' });
        }
        
        // Build the SET clause for dynamic updates
        const updateFields = [];
        const updateValues = [id]; // First param is the appointment ID
        let updateIndex = 2;
        
        // Handle each possible update field
        if ('user_id' in appointmentUpdateData) {
          updateFields.push(`user_id = $${updateIndex++}`);
          updateValues.push(appointmentUpdateData.user_id);
        }
        
        if ('title' in appointmentUpdateData) {
          updateFields.push(`title = $${updateIndex++}`);
          updateValues.push(appointmentUpdateData.title);
        }
        
        if ('description' in appointmentUpdateData) {
          updateFields.push(`description = $${updateIndex++}`);
          updateValues.push(appointmentUpdateData.description);
        }
        
        if ('appointment_date' in appointmentUpdateData) {
          updateFields.push(`appointment_date = $${updateIndex++}`);
          updateValues.push(new Date(appointmentUpdateData.appointment_date));
        }
        
        if ('duration_minutes' in appointmentUpdateData) {
          updateFields.push(`duration_minutes = $${updateIndex++}`);
          updateValues.push(appointmentUpdateData.duration_minutes);
        }
        
        if ('location' in appointmentUpdateData) {
          updateFields.push(`location = $${updateIndex++}`);
          updateValues.push(appointmentUpdateData.location);
        }
        
        if ('status' in appointmentUpdateData) {
          updateFields.push(`status = $${updateIndex++}`);
          updateValues.push(appointmentUpdateData.status);
        }
        
        if ('notes' in appointmentUpdateData) {
          updateFields.push(`notes = $${updateIndex++}`);
          updateValues.push(appointmentUpdateData.notes);
        }
        
        // Add updated_at timestamp
        updateFields.push(`updated_at = NOW()`);
        
        // If no fields to update, return an error
        if (updateFields.length === 0) {
          return res.status(400).json({ error: 'No update data provided' });
        }
        
        // Construct and execute the update query
        const appointmentUpdateQuery = `
          UPDATE sales_appointments
          SET ${updateFields.join(', ')}
          WHERE id = $1
          RETURNING *
        `;
        
        const updatedAppointment = await query(appointmentUpdateQuery, updateValues);
        
        return res.status(200).json(updatedAppointment.rows[0]);

      case 'DELETE':
        // Delete an appointment
        const { appointmentId } = req.query;
        
        if (!appointmentId) {
          return res.status(400).json({ error: 'Appointment ID is required' });
        }
        
        // Check if appointment exists
        const deleteAppointmentCheck = await query('SELECT id FROM sales_appointments WHERE id = $1', [appointmentId]);
        
        if (deleteAppointmentCheck.rows.length === 0) {
          return res.status(404).json({ error: 'Appointment not found' });
        }
        
        // Delete the appointment
        await query('DELETE FROM sales_appointments WHERE id = $1', [appointmentId]);
        
        return res.status(200).json({ message: 'Appointment deleted successfully' });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Error handling sales appointments request:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}