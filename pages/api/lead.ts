import type { NextApiRequest, NextApiResponse } from 'next';
import { query, queryOne } from '@/lib/db';

type LeadData = {
  name: string;
  email: string;
  phone: string;
  message: string;
  serviceType: string;
  companySlug: string;
  leadType: string;
  timestamp: string;
};

type ResponseData = {
  success: boolean;
  message: string;
  leadId?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const leadData: LeadData = req.body;
    
    // Basic validation
    if (!leadData.name || !leadData.email || !leadData.phone || !leadData.message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    // Get company ID from slug
    const company = await queryOne(
      'SELECT id FROM companies WHERE slug = $1',
      [leadData.companySlug]
    );
    
    if (!company) {
      return res.status(404).json({ 
        success: false, 
        message: 'Company not found' 
      });
    }
    
    // Insert lead into database
    const result = await query(
      `INSERT INTO leads 
       (company_id, name, email, phone, message, service_type, lead_type, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        company.id,
        leadData.name,
        leadData.email,
        leadData.phone,
        leadData.message,
        leadData.serviceType,
        leadData.leadType || 'widget',
        new Date().toISOString()
      ]
    );
    
    const leadId = result.rows[0]?.id;
    
    // Optional: Send notification here (SMS/email)
    // await sendNotification(company.id, leadData);
    
    return res.status(200).json({
      success: true,
      message: 'Lead submitted successfully',
      leadId
    });
    
  } catch (error) {
    console.error('Error processing lead:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process lead'
    });
  }
}