import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

type ResponseData = {
  success: boolean;
  message?: string;
  jobs?: any[];
  job?: any;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getJobs(req, res);
    case 'POST':
      return createJob(req, res);
    case 'PUT':
      return updateJob(req, res);
    case 'DELETE':
      return deleteJob(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  }
}

// Get all jobs for a company or a single job if id is provided
async function getJobs(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { company_id, id, status, customer_id } = req.query;

  if (!company_id) {
    return res.status(400).json({ success: false, message: 'Company ID is required' });
  }

  try {
    let sql;
    let params: any[] = [company_id];
    let paramIndex = 2; // Start from 2 because $1 is already used for company_id

    if (id) {
      // Get a single job
      sql = `
        SELECT j.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address,
               c.city as customer_city, c.state as customer_state
        FROM hvac_jobs j
        JOIN hvac_contacts c ON j.customer_id = c.id
        WHERE j.company_id = $1 AND j.id = $2
      `;
      params.push(id);
      
      const result = await query(sql, params);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Job not found' });
      }
      
      return res.status(200).json({ success: true, job: result.rows[0] });
    } else {
      // Build query with filters
      let whereConditions = ['j.company_id = $1'];
      
      if (status) {
        whereConditions.push(`j.status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }
      
      if (customer_id) {
        whereConditions.push(`j.customer_id = $${paramIndex}`);
        params.push(customer_id);
        paramIndex++;
      }
      
      sql = `
        SELECT j.*, c.name as customer_name, c.phone as customer_phone, 
               c.address as customer_address
        FROM hvac_jobs j
        JOIN hvac_contacts c ON j.customer_id = c.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY 
          CASE 
            WHEN j.status = 'scheduled' THEN 1
            WHEN j.status = 'in-progress' THEN 2
            WHEN j.status = 'completed' THEN 3
            WHEN j.status = 'cancelled' THEN 4
            ELSE 5
          END,
          j.scheduled_date ASC
      `;
      
      const result = await query(sql, params);
      return res.status(200).json({ success: true, jobs: result.rows });
    }
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Create a new job
async function createJob(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { 
    company_id, 
    customer_id, 
    description, 
    status, 
    priority, 
    scheduled_date, 
    technician, 
    job_type 
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
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `;

    const params = [
      company_id, 
      customer_id, 
      description, 
      status || 'scheduled', 
      priority || 'medium', 
      scheduled_date,
      technician,
      job_type
    ];
    
    const result = await query(sql, params);
    
    // Return the job with customer details
    const jobWithCustomer = await query(
      `SELECT j.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address
       FROM hvac_jobs j
       JOIN hvac_contacts c ON j.customer_id = c.id
       WHERE j.id = $1`,
      [result.rows[0].id]
    );
    
    return res.status(201).json({ success: true, job: jobWithCustomer.rows[0] });
  } catch (error: any) {
    console.error('Error creating job:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Update a job
async function updateJob(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { 
    id,
    company_id, 
    customer_id, 
    description, 
    status, 
    priority, 
    scheduled_date, 
    technician, 
    job_type 
  } = req.body;

  if (!id || !company_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Job ID and Company ID are required' 
    });
  }

  try {
    // Check if the job exists and belongs to the company
    const checkSql = 'SELECT * FROM hvac_jobs WHERE id = $1 AND company_id = $2';
    const checkResult = await query(checkSql, [id, company_id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Job not found or does not belong to this company' 
      });
    }

    // If customer_id is provided, verify that it exists and belongs to the company
    if (customer_id) {
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

    const sql = `
      UPDATE hvac_jobs
      SET customer_id = $3,
          description = $4,
          status = $5,
          priority = $6,
          scheduled_date = $7,
          technician = $8,
          job_type = $9
      WHERE id = $1 AND company_id = $2
      RETURNING *
    `;

    const params = [
      id,
      company_id,
      customer_id || checkResult.rows[0].customer_id,
      description || checkResult.rows[0].description,
      status || checkResult.rows[0].status,
      priority || checkResult.rows[0].priority,
      scheduled_date || checkResult.rows[0].scheduled_date,
      technician || checkResult.rows[0].technician,
      job_type || checkResult.rows[0].job_type
    ];
    
    const result = await query(sql, params);
    
    // Return the job with customer details
    const jobWithCustomer = await query(
      `SELECT j.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address
       FROM hvac_jobs j
       JOIN hvac_contacts c ON j.customer_id = c.id
       WHERE j.id = $1`,
      [result.rows[0].id]
    );
    
    return res.status(200).json({ success: true, job: jobWithCustomer.rows[0] });
  } catch (error: any) {
    console.error('Error updating job:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Delete a job
async function deleteJob(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { id, company_id } = req.body;

  if (!id || !company_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Job ID and Company ID are required' 
    });
  }

  try {
    // Check if the job exists and belongs to the company
    const checkSql = 'SELECT * FROM hvac_jobs WHERE id = $1 AND company_id = $2';
    const checkResult = await query(checkSql, [id, company_id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Job not found or does not belong to this company' 
      });
    }

    // Check if there are any invoices for this job
    const invoiceCheck = await query(
      'SELECT COUNT(*) as count FROM hvac_invoices WHERE job_id = $1',
      [id]
    );
    
    if (parseInt(invoiceCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete job with existing invoices' 
      });
    }

    const sql = 'DELETE FROM hvac_jobs WHERE id = $1 AND company_id = $2 RETURNING id';
    const result = await query(sql, [id, company_id]);
    
    return res.status(200).json({ 
      success: true, 
      message: `Job ID ${result.rows[0].id} has been deleted successfully` 
    });
  } catch (error: any) {
    console.error('Error deleting job:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}