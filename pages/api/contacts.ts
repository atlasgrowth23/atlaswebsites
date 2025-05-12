import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

type ResponseData = {
  success: boolean;
  message?: string;
  contacts?: any[];
  contact?: any;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Normalize the company_id from either businessSlug or company_id parameter
  let company_id = req.query.businessSlug || req.query.company_id || '';
  
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
    // Get all contacts for this business
    const contactsResult = await query(`
      SELECT 
        c.id, 
        c.name, 
        c.email, 
        c.phone, 
        c.address, 
        c.city, 
        c.state, 
        c.zip, 
        c.type, 
        c.notes, 
        c.last_service_date,
        c.created_at,
        COUNT(e.id) as equipment_count
      FROM 
        hvac_contacts c
      LEFT JOIN
        hvac_equipment e ON c.id = e.contact_id
      WHERE 
        c.company_id = $1
      GROUP BY
        c.id
      ORDER BY
        c.name ASC
    `, [company_id]);

    return res.status(200).json({
      success: true,
      contacts: contactsResult.rows
    });
  } catch (error: any) {
    console.error('Error fetching contacts:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch contacts: ' + error.message
    });
  }
}