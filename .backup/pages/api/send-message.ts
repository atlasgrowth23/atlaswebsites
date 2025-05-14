import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

type MessageData = {
  name: string;
  email: string;
  phone?: string;
  message: string;
  companyId: string | number;
  companySlug?: string;
};

type ResponseData = {
  success: boolean;
  message: string;
  data?: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  // Get message data from request body
  const { name, email, phone, message, companyId, companySlug }: MessageData = req.body;

  // Validate required fields
  if (!name || !email || !message || (!companyId && !companySlug)) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }

  try {
    // Determine what identifier we have (id or slug)
    let company_identifier = companyId;
    let isSlug = false;
    
    // If we have a slug but no ID, or the ID is actually a slug (string that's not a number)
    if (companySlug || (typeof companyId === 'string' && isNaN(Number(companyId)))) {
      company_identifier = companySlug || companyId;
      isSlug = true;
    }
    
    // Get company details
    let companyResult;
    if (isSlug) {
      // If we have a slug, look up the company by slug
      companyResult = await query(`
        SELECT id, slug, name FROM companies WHERE slug = $1
      `, [company_identifier]);
    } else {
      // Otherwise look up by ID
      companyResult = await query(`
        SELECT id, slug, name FROM companies WHERE id = $1
      `, [company_identifier]);
    }
    
    // If company not found, return error
    if (!companyResult.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    const company = companyResult.rows[0];
    const companyName = company.name;
    const effectiveCompanyId = isSlug ? company.slug : company.id;
    
    // Create messages table if not exists
    await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        company_id VARCHAR(255) NOT NULL,
        sender_name VARCHAR(255) NOT NULL,
        sender_email VARCHAR(255) NOT NULL,
        sender_phone VARCHAR(50),
        message_content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        read BOOLEAN DEFAULT FALSE
      )
    `);
    
    // Insert message into the database
    const result = await query(`
      INSERT INTO messages (company_id, sender_name, sender_email, sender_phone, message_content, created_at, read)
      VALUES ($1, $2, $3, $4, $5, NOW(), FALSE)
      RETURNING id
    `, [effectiveCompanyId, name, email, phone || null, message]);
    
    // Get the inserted message ID
    const messageId = result.rows[0].id;
    
    console.log(`New message ${messageId} added for company: ${effectiveCompanyId} (${companyName})`);
    
    return res.status(200).json({
      success: true,
      message: `Message sent successfully to ${companyName}`,
      data: { messageId }
    });
    
  } catch (error: any) {
    console.error('Error sending message:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to send message: ' + error.message
    });
  }
}