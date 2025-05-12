import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

type ResponseData = {
  success: boolean;
  message?: string;
  username?: string;
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

  const { slug } = req.query;
  
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: 'Business slug is required' 
    });
  }

  try {
    // Query to get default credentials by business slug
    const result = await query(
      'SELECT username FROM user_credentials WHERE business_slug = $1',
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No credentials found for business "${slug}"`
      });
    }

    // Return just the username, not the password for security
    return res.status(200).json({
      success: true,
      username: result.rows[0].username
    });
  } catch (error: any) {
    console.error('Error fetching default credentials:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch credentials: ' + error.message
    });
  }
}