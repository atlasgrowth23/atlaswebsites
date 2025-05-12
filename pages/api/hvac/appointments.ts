import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

type ResponseData = {
  success: boolean;
  message?: string;
  appointments?: any[];
  appointment?: any;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getAppointments(req, res);
    case 'POST':
      return createAppointment(req, res);
    case 'PUT':
      return updateAppointment(req, res);
    case 'DELETE':
      return deleteAppointment(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  }
}

// Get all upcoming appointments (scheduled jobs) for a company
async function getAppointments(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { company_id, id, contact_id, technician, date_range, from_date, to_date } = req.query;

  if (!company_id) {
    return res.status(400).json({ success: false, message: 'Company ID is required' });
  }

  try {
    let sql;
    let params: any[] = [company_id];
    let paramIndex = 2; // Start from 2 because $1 is already used for company_id
    let whereConditions = ['j.company_id = $1', "j.status = 'scheduled'"];

    if (id) {
      // Get a single appointment
      sql = `
        SELECT j.*, c.name as customer_name, c.phone as customer_phone,
               c.address as customer_address, c.city as customer_city, c.state as customer_state, c.id as contact_id
        FROM hvac_jobs j
        JOIN hvac_contacts c ON j.customer_id = c.id
        WHERE j.company_id = $1 AND j.id = $2 AND j.status = 'scheduled'
      `;
      params.push(id);
      
      const result = await query(sql, params);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Appointment not found' });
      }
      
      return res.status(200).json({ success: true, appointment: result.rows[0] });
    } else {
      // Build query with filters
      if (contact_id) {
        whereConditions.push(`j.customer_id = $${paramIndex}`);
        params.push(contact_id);
        paramIndex++;
      }
      
      if (technician) {
        whereConditions.push(`j.technician ILIKE $${paramIndex}`);
        params.push(`%${technician}%`); // Case-insensitive partial match
        paramIndex++;
      }
      
      // Date range filtering
      if (date_range === 'today') {
        whereConditions.push(`DATE(j.scheduled_date) = CURRENT_DATE`);
      } else if (date_range === 'tomorrow') {
        whereConditions.push(`DATE(j.scheduled_date) = CURRENT_DATE + INTERVAL '1 day'`);
      } else if (date_range === 'week') {
        whereConditions.push(`DATE(j.scheduled_date) BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'`);
      } else if (date_range === 'month') {
        whereConditions.push(`DATE(j.scheduled_date) BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'`);
      } else if (from_date) {
        // Custom date range
        whereConditions.push(`DATE(j.scheduled_date) >= $${paramIndex}`);
        params.push(from_date);
        paramIndex++;
        
        if (to_date) {
          whereConditions.push(`DATE(j.scheduled_date) <= $${paramIndex}`);
          params.push(to_date);
          paramIndex++;
        }
      }
      
      sql = `
        SELECT j.*, c.name as customer_name, c.phone as customer_phone, 
               c.address as customer_address, c.city as customer_city, 
               c.state as customer_state, c.id as contact_id,
               (
                 SELECT array_agg(e.id) 
                 FROM hvac_equipment e 
                 WHERE e.contact_id = c.id
               ) as equipment_ids
        FROM hvac_jobs j
        JOIN hvac_contacts c ON j.customer_id = c.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY j.scheduled_date ASC
      `;
      
      const result = await query(sql, params);
      return res.status(200).json({ success: true, appointments: result.rows });
    }
  } catch (error: any) {
    console.error('Error fetching appointments:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Create a new appointment (scheduled job)
async function createAppointment(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { 
    company_id, 
    customer_id, 
    description, 
    priority, 
    scheduled_date, 
    technician, 
    job_type,
    equipment_id
  } = req.body;

  if (!company_id || !customer_id || !description || !scheduled_date) {
    return res.status(400).json({ 
      success: false, 
      message: 'Company ID, customer ID, description, and scheduled date are required' 
    });
  }

  try {
    // Verify that the customer exists and belongs to the company
    const customerCheck = await query(
      'SELECT id FROM hvac_contacts WHERE id = $1 AND company_id = $2',
      [customer_id, company_id]
    );
    
    if (customerCheck.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer not found or does not belong to this company' 
      });
    }

    // If equipment_id is provided, verify it exists and belongs to the customer
    if (equipment_id) {
      const equipmentCheck = await query(
        'SELECT id FROM hvac_equipment WHERE id = $1 AND contact_id = $2 AND company_id = $3',
        [equipment_id, customer_id, company_id]
      );
      
      if (equipmentCheck.rows.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Equipment not found or does not belong to this customer' 
        });
      }
    }

    // Prepare the description with equipment information if available
    let finalDescription = description;
    if (equipment_id) {
      const equipmentInfo = await query(
        'SELECT equipment_type, brand, model, serial_number FROM hvac_equipment WHERE id = $1',
        [equipment_id]
      );
      
      if (equipmentInfo.rows.length > 0) {
        const equipment = equipmentInfo.rows[0];
        finalDescription = `EQUIPMENT: ${equipment.equipment_type} - ${equipment.brand} ${equipment.model}\nSERIAL: ${equipment.serial_number}\n\n${description}`;
      }
    }

    const sql = `
      INSERT INTO hvac_jobs (
        company_id, 
        customer_id, 
        description, 
        status, 
        priority, 
        scheduled_date, 
        technician, 
        job_type, 
        created_at
      )
      VALUES ($1, $2, $3, 'scheduled', $4, $5, $6, $7, NOW())
      RETURNING *
    `;

    const params = [
      company_id, 
      customer_id, 
      finalDescription, 
      priority || 'medium', 
      scheduled_date,
      technician || '',
      job_type || 'service'
    ];
    
    const result = await query(sql, params);
    
    // Return the appointment with customer details
    const appointmentWithCustomer = await query(
      `SELECT j.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address
       FROM hvac_jobs j
       JOIN hvac_contacts c ON j.customer_id = c.id
       WHERE j.id = $1`,
      [result.rows[0].id]
    );
    
    return res.status(201).json({ 
      success: true, 
      appointment: appointmentWithCustomer.rows[0],
      message: 'Appointment scheduled successfully'
    });
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Update an appointment (scheduled job)
async function updateAppointment(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { 
    id,
    company_id, 
    customer_id, 
    description, 
    priority, 
    scheduled_date, 
    technician, 
    job_type,
    equipment_id
  } = req.body;

  if (!id || !company_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Appointment ID and Company ID are required' 
    });
  }

  try {
    // Check if the appointment exists, belongs to the company, and is still in 'scheduled' status
    const checkSql = 'SELECT * FROM hvac_jobs WHERE id = $1 AND company_id = $2 AND status = $3';
    const checkResult = await query(checkSql, [id, company_id, 'scheduled']);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Appointment not found, does not belong to this company, or is no longer in scheduled status' 
      });
    }

    // If customer_id is provided, verify that it exists and belongs to the company
    if (customer_id && customer_id !== checkResult.rows[0].customer_id) {
      const customerCheck = await query(
        'SELECT id FROM hvac_contacts WHERE id = $1 AND company_id = $2',
        [customer_id, company_id]
      );
      
      if (customerCheck.rows.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Customer not found or does not belong to this company' 
        });
      }
    }

    // Prepare the description with equipment information if needed
    let finalDescription = description || checkResult.rows[0].description;
    if (equipment_id && !description) {
      // Only modify the description if equipment changed but no new description provided
      const equipmentInfo = await query(
        'SELECT equipment_type, brand, model, serial_number FROM hvac_equipment WHERE id = $1',
        [equipment_id]
      );
      
      if (equipmentInfo.rows.length > 0) {
        const equipment = equipmentInfo.rows[0];
        // Check if the description already has equipment info and replace it, or add it
        if (finalDescription.includes('EQUIPMENT:')) {
          const lines = finalDescription.split('\n');
          const nonEquipmentLines = lines.slice(lines.findIndex(line => !line.includes('EQUIPMENT:') && !line.includes('SERIAL:')));
          finalDescription = `EQUIPMENT: ${equipment.equipment_type} - ${equipment.brand} ${equipment.model}\nSERIAL: ${equipment.serial_number}\n\n${nonEquipmentLines.join('\n')}`;
        } else {
          finalDescription = `EQUIPMENT: ${equipment.equipment_type} - ${equipment.brand} ${equipment.model}\nSERIAL: ${equipment.serial_number}\n\n${finalDescription}`;
        }
      }
    }

    const sql = `
      UPDATE hvac_jobs
      SET customer_id = $3,
          description = $4,
          priority = $5,
          scheduled_date = $6,
          technician = $7,
          job_type = $8,
          updated_at = NOW()
      WHERE id = $1 AND company_id = $2 AND status = 'scheduled'
      RETURNING *
    `;

    const params = [
      id,
      company_id,
      customer_id || checkResult.rows[0].customer_id,
      finalDescription,
      priority || checkResult.rows[0].priority,
      scheduled_date || checkResult.rows[0].scheduled_date,
      technician || checkResult.rows[0].technician,
      job_type || checkResult.rows[0].job_type
    ];
    
    const result = await query(sql, params);
    
    if (result.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Appointment could not be updated. It may have changed status during the update.' 
      });
    }
    
    // Return the updated appointment with customer details
    const appointmentWithCustomer = await query(
      `SELECT j.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address
       FROM hvac_jobs j
       JOIN hvac_contacts c ON j.customer_id = c.id
       WHERE j.id = $1`,
      [result.rows[0].id]
    );
    
    return res.status(200).json({ 
      success: true, 
      appointment: appointmentWithCustomer.rows[0],
      message: 'Appointment updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating appointment:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Delete an appointment (cancel a scheduled job)
async function deleteAppointment(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { id, company_id, cancellation_reason } = req.body;

  if (!id || !company_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Appointment ID and Company ID are required' 
    });
  }

  try {
    // Check if the appointment exists, belongs to the company, and is still in 'scheduled' status
    const checkSql = 'SELECT * FROM hvac_jobs WHERE id = $1 AND company_id = $2 AND status = $3';
    const checkResult = await query(checkSql, [id, company_id, 'scheduled']);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Appointment not found, does not belong to this company, or is no longer in scheduled status' 
      });
    }

    // Instead of deleting, cancel the appointment by updating status
    const sql = `
      UPDATE hvac_jobs
      SET status = 'cancelled',
          updated_at = NOW()
      WHERE id = $1 AND company_id = $2 AND status = 'scheduled'
      RETURNING *
    `;
    
    const result = await query(sql, [id, company_id]);
    
    // If cancellation reason provided, add it to the job description
    if (cancellation_reason) {
      const timestamp = new Date().toISOString();
      const cancelNote = `[${timestamp}] Appointment cancelled: ${cancellation_reason}\n\n`;
      
      await query(
        `UPDATE hvac_jobs 
         SET description = description || $1
         WHERE id = $2`,
        [cancelNote, id]
      );
    }
    
    return res.status(200).json({ 
      success: true, 
      message: `Appointment ID ${result.rows[0].id} has been cancelled successfully` 
    });
  } catch (error: any) {
    console.error('Error cancelling appointment:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}