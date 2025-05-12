import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

type Message = {
  id: number;
  company_id: number;
  sender_name: string;
  sender_email: string;
  sender_phone: string | null;
  message_content: string;
  created_at: string;
  read: boolean;
};

type ResponseData = {
  success: boolean;
  messages?: Message[];
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  const { companyId } = req.query;
  
  if (!companyId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Company ID is required' 
    });
  }

  try {
    // Query to get all messages for a company, ordered by newest first
    const result = await query(`
      SELECT 
        id, 
        company_id, 
        sender_name, 
        sender_email, 
        sender_phone, 
        message_content, 
        created_at,
        read
      FROM messages 
      WHERE company_id = $1
      ORDER BY created_at DESC
    `, [companyId]);

    // Format the response
    const messages = result.rows;

    return res.status(200).json({
      success: true,
      messages
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch messages: ' + error.message
    });
  }
}