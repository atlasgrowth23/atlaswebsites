import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

type ResponseData = {
  success: boolean;
  companyId?: number;
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const { slug } = req.query;
  
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: 'Company slug is required' 
    });
  }

  try {
    // Query to get company ID by slug
    const result = await query(
      'SELECT id FROM companies WHERE slug = $1',
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Company with slug "${slug}" not found`
      });
    }

    const companyId = result.rows[0].id;

    return res.status(200).json({
      success: true,
      companyId
    });
  } catch (error: any) {
    console.error('Error fetching company ID:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch company ID: ' + error.message
    });
  }
}