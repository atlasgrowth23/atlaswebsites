import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

type ResponseData = {
  success: boolean;
  message?: string;
  serviceRecords?: any[];
  serviceRecord?: any;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getServiceRecords(req, res);
    case 'POST':
      return createServiceRecord(req, res);
    case 'PUT':
      return updateServiceRecord(req, res);
    case 'DELETE':
      return deleteServiceRecord(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  }
}

// Get service records with various filters
async function getServiceRecords(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { company_id, id, equipment_id, job_id, contact_id } = req.query;

  if (!company_id) {
    return res.status(400).json({ success: false, message: 'Company ID is required' });
  }

  try {
    let sql;
    let params: any[] = [company_id];
    let paramIndex = 2; // Start from 2 because $1 is already used for company_id
    let whereConditions = ['sh.company_id = $1'];

    if (id) {
      // Get a single service record
      sql = `
        SELECT sh.*, 
               e.equipment_type, e.brand, e.model, e.serial_number,
               c.name as customer_name, c.phone as customer_phone
        FROM hvac_service_history sh
        JOIN hvac_equipment e ON sh.equipment_id = e.id
        JOIN hvac_contacts c ON e.contact_id = c.id
        WHERE sh.company_id = $1 AND sh.id = $2
      `;
      params.push(id);
      
      const result = await query(sql, params);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Service record not found' });
      }
      
      return res.status(200).json({ success: true, serviceRecord: result.rows[0] });
    } else {
      // Add filters if provided
      if (equipment_id) {
        whereConditions.push(`sh.equipment_id = $${paramIndex}`);
        params.push(equipment_id);
        paramIndex++;
      }
      
      if (job_id) {
        whereConditions.push(`sh.job_id = $${paramIndex}`);
        params.push(job_id);
        paramIndex++;
      }
      
      if (contact_id) {
        whereConditions.push(`e.contact_id = $${paramIndex}`);
        params.push(contact_id);
        paramIndex++;
      }
      
      sql = `
        SELECT sh.*, 
               e.equipment_type, e.brand, e.model, e.serial_number,
               c.name as customer_name, c.id as contact_id
        FROM hvac_service_history sh
        JOIN hvac_equipment e ON sh.equipment_id = e.id
        JOIN hvac_contacts c ON e.contact_id = c.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY sh.service_date DESC
      `;
      
      const result = await query(sql, params);
      return res.status(200).json({ success: true, serviceRecords: result.rows });
    }
  } catch (error: any) {
    console.error('Error fetching service records:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Create a new service record
async function createServiceRecord(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { 
    company_id, 
    equipment_id, 
    job_id, 
    service_date, 
    service_type, 
    technician, 
    findings, 
    recommendations 
  } = req.body;

  if (!company_id || !equipment_id || !service_date || !service_type) {
    return res.status(400).json({ 
      success: false, 
      message: 'Company ID, equipment ID, service date, and service type are required' 
    });
  }

  try {
    // Verify that the equipment exists and belongs to the company
    const equipmentCheck = await query(
      'SELECT id FROM hvac_equipment WHERE id = $1 AND company_id = $2',
      [equipment_id, company_id]
    );
    
    if (equipmentCheck.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Equipment not found or does not belong to this company' 
      });
    }

    // If job_id is provided, verify it exists and belongs to the company
    if (job_id) {
      const jobCheck = await query(
        'SELECT id FROM hvac_jobs WHERE id = $1 AND company_id = $2',
        [job_id, company_id]
      );
      
      if (jobCheck.rows.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Job not found or does not belong to this company' 
        });
      }
    }

    const sql = `
      INSERT INTO hvac_service_history (
        company_id, 
        equipment_id, 
        job_id, 
        service_date, 
        service_type, 
        technician, 
        findings, 
        recommendations, 
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `;

    const params = [
      company_id, 
      equipment_id, 
      job_id || null, 
      service_date,
      service_type,
      technician || '',
      findings || '',
      recommendations || ''
    ];
    
    const result = await query(sql, params);
    
    // Update the equipment's last_service_date
    await query(
      'UPDATE hvac_equipment SET last_service_date = $1, updated_at = NOW() WHERE id = $2',
      [service_date, equipment_id]
    );
    
    // If this is linked to a job, update the job's status to completed
    if (job_id) {
      await query(
        'UPDATE hvac_jobs SET status = $1, completion_date = $2, updated_at = NOW() WHERE id = $3',
        ['completed', service_date, job_id]
      );
    }
    
    // Return the service record with equipment and customer details
    const recordWithDetails = await query(
      `SELECT sh.*, 
              e.equipment_type, e.brand, e.model, e.serial_number,
              c.name as customer_name, c.id as contact_id
       FROM hvac_service_history sh
       JOIN hvac_equipment e ON sh.equipment_id = e.id
       JOIN hvac_contacts c ON e.contact_id = c.id
       WHERE sh.id = $1`,
      [result.rows[0].id]
    );
    
    return res.status(201).json({ success: true, serviceRecord: recordWithDetails.rows[0] });
  } catch (error: any) {
    console.error('Error creating service record:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Update a service record
async function updateServiceRecord(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { 
    id,
    company_id, 
    equipment_id, 
    job_id, 
    service_date, 
    service_type, 
    technician, 
    findings, 
    recommendations 
  } = req.body;

  if (!id || !company_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Service record ID and Company ID are required' 
    });
  }

  try {
    // Check if the service record exists and belongs to the company
    const checkSql = 'SELECT * FROM hvac_service_history WHERE id = $1 AND company_id = $2';
    const checkResult = await query(checkSql, [id, company_id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Service record not found or does not belong to this company' 
      });
    }

    // If equipment_id is changed, verify it exists and belongs to company
    if (equipment_id && equipment_id !== checkResult.rows[0].equipment_id) {
      const equipmentCheck = await query(
        'SELECT id FROM hvac_equipment WHERE id = $1 AND company_id = $2',
        [equipment_id, company_id]
      );
      
      if (equipmentCheck.rows.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Equipment not found or does not belong to this company' 
        });
      }
    }

    // If job_id is changed, verify it exists and belongs to company
    if (job_id && job_id !== checkResult.rows[0].job_id) {
      const jobCheck = await query(
        'SELECT id FROM hvac_jobs WHERE id = $1 AND company_id = $2',
        [job_id, company_id]
      );
      
      if (jobCheck.rows.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Job not found or does not belong to this company' 
        });
      }
    }

    const sql = `
      UPDATE hvac_service_history
      SET equipment_id = $3,
          job_id = $4,
          service_date = $5,
          service_type = $6,
          technician = $7,
          findings = $8,
          recommendations = $9
      WHERE id = $1 AND company_id = $2
      RETURNING *
    `;

    const params = [
      id,
      company_id,
      equipment_id || checkResult.rows[0].equipment_id,
      job_id || checkResult.rows[0].job_id,
      service_date || checkResult.rows[0].service_date,
      service_type || checkResult.rows[0].service_type,
      technician || checkResult.rows[0].technician,
      findings || checkResult.rows[0].findings,
      recommendations || checkResult.rows[0].recommendations
    ];
    
    const result = await query(sql, params);
    
    // If equipment_id changed, update both old and new equipment's last_service_date
    if (equipment_id && equipment_id !== checkResult.rows[0].equipment_id) {
      // Update new equipment's last_service_date
      await query(
        'UPDATE hvac_equipment SET last_service_date = $1, updated_at = NOW() WHERE id = $2',
        [service_date || checkResult.rows[0].service_date, equipment_id]
      );
      
      // Update old equipment's last_service_date to the most recent service
      await query(`
        UPDATE hvac_equipment 
        SET last_service_date = (
          SELECT MAX(service_date) 
          FROM hvac_service_history 
          WHERE equipment_id = $1
        ),
        updated_at = NOW()
        WHERE id = $1`,
        [checkResult.rows[0].equipment_id]
      );
    } else if (service_date && service_date !== checkResult.rows[0].service_date) {
      // Update equipment's last_service_date if service_date changed
      await query(
        'UPDATE hvac_equipment SET last_service_date = $1, updated_at = NOW() WHERE id = $2',
        [service_date, equipment_id || checkResult.rows[0].equipment_id]
      );
    }
    
    // Return the service record with equipment and customer details
    const recordWithDetails = await query(
      `SELECT sh.*, 
              e.equipment_type, e.brand, e.model, e.serial_number,
              c.name as customer_name, c.id as contact_id
       FROM hvac_service_history sh
       JOIN hvac_equipment e ON sh.equipment_id = e.id
       JOIN hvac_contacts c ON e.contact_id = c.id
       WHERE sh.id = $1`,
      [result.rows[0].id]
    );
    
    return res.status(200).json({ success: true, serviceRecord: recordWithDetails.rows[0] });
  } catch (error: any) {
    console.error('Error updating service record:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Delete a service record
async function deleteServiceRecord(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { id, company_id } = req.body;

  if (!id || !company_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Service record ID and Company ID are required' 
    });
  }

  try {
    // Check if the service record exists and belongs to the company
    const checkSql = 'SELECT * FROM hvac_service_history WHERE id = $1 AND company_id = $2';
    const checkResult = await query(checkSql, [id, company_id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Service record not found or does not belong to this company' 
      });
    }

    const sql = 'DELETE FROM hvac_service_history WHERE id = $1 AND company_id = $2 RETURNING id, equipment_id';
    const result = await query(sql, [id, company_id]);
    
    // Update the equipment's last_service_date to the most recent service
    await query(`
      UPDATE hvac_equipment 
      SET last_service_date = (
        SELECT MAX(service_date) 
        FROM hvac_service_history 
        WHERE equipment_id = $1
      ),
      updated_at = NOW()
      WHERE id = $1`,
      [result.rows[0].equipment_id]
    );
    
    return res.status(200).json({ 
      success: true, 
      message: `Service record ID ${result.rows[0].id} has been deleted successfully` 
    });
  } catch (error: any) {
    console.error('Error deleting service record:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}