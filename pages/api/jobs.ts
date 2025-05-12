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
  // Normalize the company_id from either businessSlug or company_id parameter
  let company_id = req.query.businessSlug || req.query.company_id || '';
  const { id, status, customer_id } = req.query;
  
  if (!company_id || (Array.isArray(company_id) && company_id.length === 0)) {
    return res.status(400).json({
      success: false,
      message: 'Company ID or business slug is required'
    });
  }
  
  // Convert to string if it's an array
  if (Array.isArray(company_id)) {
    company_id = company_id[0];
  }

  try {
    // Build query parameters and conditions
    let params: any[] = [company_id];
    let paramIndex = 2; // Start from 2 because $1 is company_id
    let whereConditions = ['j.company_id = $1'];
    
    // Add filters if provided
    if (status) {
      let statusValue = Array.isArray(status) ? status[0] : status;
      whereConditions.push(`j.status = $${paramIndex}`);
      params.push(statusValue);
      paramIndex++;
    }
    
    if (customer_id) {
      let customerValue = Array.isArray(customer_id) ? customer_id[0] : customer_id;
      whereConditions.push(`j.customer_id = $${paramIndex}`);
      params.push(customerValue);
    }
    
    // Get jobs with customer information
    const sql = `
      SELECT j.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address
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
    
    const jobsResult = await query(sql, params);

    return res.status(200).json({
      success: true,
      jobs: jobsResult.rows
    });
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs: ' + error.message
    });
  }
}