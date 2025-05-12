import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

type ResponseData = {
  success: boolean;
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use POST.'
    });
  }

  const { messageId } = req.body;

  if (!messageId) {
    return res.status(400).json({
      success: false,
      message: 'Missing messageId'
    });
  }

  try {
    // Update the message to mark it as read
    await query(
      'UPDATE messages SET read = true WHERE id = $1',
      [messageId]
    );

    return res.status(200).json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error: any) {
    console.error('Error marking message as read:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
}