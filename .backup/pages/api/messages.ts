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
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use GET.'
    });
  }

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
    // Create messages table if it doesn't exist yet
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

    // Insert sample messages for testing if the table is empty
    const messageCount = await query('SELECT COUNT(*) FROM messages WHERE company_id = $1', [company_id]);
    
    if (parseInt(messageCount.rows[0].count) === 0) {
      // Add a few sample messages
      await query(`
        INSERT INTO messages 
          (company_id, sender_name, sender_email, sender_phone, message_content, created_at, read)
        VALUES
          ($1, 'John Smith', 'john.smith@example.com', '(555) 123-4567', 'I need service for my AC unit. It''s not cooling properly and making strange noises. Can someone come take a look at it this week?', NOW() - INTERVAL '2 days', FALSE),
          ($1, 'Sarah Johnson', 'sarah.j@example.com', '(555) 987-6543', 'Hi there, I''m interested in getting a quote for a new HVAC system for my home. We have about 2,000 sq ft. When can someone come out for an estimate?', NOW() - INTERVAL '5 days', TRUE),
          ($1, 'Mike Wilson', 'mike.w@example.com', '(555) 555-5555', 'My furnace is making a loud banging noise when it turns on. It''s concerning and I need someone to check it ASAP. Please call me when you can fit me in.', NOW() - INTERVAL '1 day', FALSE),
          ($1, 'Emily Davis', 'emily.davis@example.com', NULL, 'Just wanted to say thank you for the great service last week. The technician was professional and fixed our issue quickly.', NOW() - INTERVAL '10 days', TRUE),
          ($1, 'Robert Brown', 'robert.b@example.com', '(555) 222-3333', 'I need to schedule my annual maintenance for my HVAC system. I''m a regular customer and would like to set something up for next month.', NOW() - INTERVAL '3 hours', FALSE)
      `, [company_id]);
    }

    // Query messages for the company
    const messagesResult = await query(`
      SELECT * FROM messages 
      WHERE company_id = $1
      ORDER BY created_at DESC
    `, [company_id]);

    return res.status(200).json({
      success: true,
      messages: messagesResult.rows
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
}