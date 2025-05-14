import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

type ResponseData = {
  success: boolean;
  message?: string;
  businessSlug?: string;
  username?: string;
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

  const { username, password, businessSlug } = req.body;
  
  if (!businessSlug) {
    return res.status(400).json({ 
      success: false, 
      message: 'Business ID is required' 
    });
  }

  try {
    // Simple validation: Check if the business exists and password is "demo123"
    if (password !== 'demo123') {
      return res.status(401).json({
        success: false,
        message: 'Invalid password. Please use the standard portal password.'
      });
    }
    
    // Verify business exists
    const businessResult = await query(
      'SELECT id, slug, name FROM companies WHERE slug = $1',
      [businessSlug]
    );

    if (businessResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Business not found. Please check your Business ID.'
      });
    }

    // Return success with the business slug
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      businessSlug: businessSlug,
      username: businessSlug  // Use businessSlug as username for simplicity
    });
  } catch (error: any) {
    console.error('Login error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to authenticate: ' + error.message
    });
  }
}