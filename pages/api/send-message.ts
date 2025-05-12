import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

type MessageData = {
  name: string;
  email: string;
  phone?: string;
  message: string;
  companyId: string;
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
  const { name, email, phone, message, companyId }: MessageData = req.body;

  // Validate required fields
  if (!name || !email || !message || !companyId) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }

  try {
    // Insert message into the database
    const result = await query(`
      INSERT INTO messages (company_id, sender_name, sender_email, sender_phone, message_content)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [companyId, name, email, phone || null, message]);
    
    // Get the inserted message ID
    const messageId = result.rows[0].id;
    
    // Fetch the company name for the response
    const companyResult = await query(`
      SELECT name FROM companies WHERE id = $1
    `, [companyId]);
    
    const companyName = companyResult.rows[0]?.name || 'the company';
    
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