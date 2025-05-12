import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

type ResponseData = {
  success: boolean;
  message?: string;
  job?: any;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const { method } = req;

  switch (method) {
    case 'PUT':
      return updateJobStatus(req, res);
    default:
      res.setHeader('Allow', ['PUT']);
      return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  }
}

// Update the status of a job
async function updateJobStatus(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { id, company_id, status, technician, notes } = req.body;

  if (!id || !company_id || !status) {
    return res.status(400).json({ 
      success: false, 
      message: 'Job ID, Company ID, and status are required' 
    });
  }

  // Validate status value
  const validStatuses = ['scheduled', 'in-progress', 'completed', 'cancelled', 'pending_parts'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      success: false, 
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
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

    // Prepare SQL and parameters based on status
    let sql;
    let params;

    if (status === 'completed') {
      // If marking as completed, set completion_date
      sql = `
        UPDATE hvac_jobs
        SET status = $3,
            technician = $4,
            completion_date = NOW(),
            updated_at = NOW()
        WHERE id = $1 AND company_id = $2
        RETURNING *
      `;
      params = [id, company_id, status, technician || checkResult.rows[0].technician];
    } else if (status === 'cancelled') {
      // If cancelling, maybe add a cancellation reason or note
      sql = `
        UPDATE hvac_jobs
        SET status = $3,
            updated_at = NOW()
        WHERE id = $1 AND company_id = $2
        RETURNING *
      `;
      params = [id, company_id, status];
    } else {
      // For other statuses
      sql = `
        UPDATE hvac_jobs
        SET status = $3,
            technician = $4,
            updated_at = NOW()
        WHERE id = $1 AND company_id = $2
        RETURNING *
      `;
      params = [id, company_id, status, technician || checkResult.rows[0].technician];
    }
    
    const result = await query(sql, params);
    
    // If notes were provided, add them to the job description
    if (notes) {
      const timestamp = new Date().toISOString();
      const statusNote = `[${timestamp}] Status changed to "${status}": ${notes}\n\n`;
      
      await query(
        `UPDATE hvac_jobs 
         SET description = description || $1
         WHERE id = $2`,
        [statusNote, id]
      );
    }
    
    // Get the updated job with customer details
    const jobWithCustomer = await query(
      `SELECT j.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address
       FROM hvac_jobs j
       JOIN hvac_contacts c ON j.customer_id = c.id
       WHERE j.id = $1`,
      [result.rows[0].id]
    );
    
    return res.status(200).json({ 
      success: true, 
      job: jobWithCustomer.rows[0],
      message: `Job status updated to ${status} successfully`
    });
  } catch (error: any) {
    console.error('Error updating job status:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}