import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

type ResponseData = {
  success: boolean;
  message?: string;
  username?: string;
  password?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only accept GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }
  
  const { slug } = req.query;
  
  if (!slug) {
    return res.status(400).json({
      success: false,
      message: 'Business slug is required'
    });
  }
  
  try {
    // Look up the company based on slug
    const slugValue = Array.isArray(slug) ? slug[0] : slug;
    
    const companyResult = await query(`
      SELECT id, slug, name FROM companies WHERE slug = $1
    `, [slugValue]);
    
    if (companyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }
    
    const company = companyResult.rows[0];
    
    // For demo purposes, return a default username/password based on the company name
    // In a real app, you would look this up from a users table
    
    // Use the first part of the company name as the username (lowercase, no spaces)
    const defaultUsername = company.name.split(' ')[0].toLowerCase();
    
    // Default password is the company name with "2024" appended
    const defaultPassword = company.name.replace(/\s+/g, '') + '2024';
    
    return res.status(200).json({
      success: true,
      username: defaultUsername,
      password: defaultPassword
    });
    
  } catch (error: any) {
    console.error('Error fetching default credentials:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
}