import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { generateHVACResponse, categorizeCustomerMessage } from '@/lib/anthropic';

type ResponseData = {
  success: boolean;
  message?: string;
  response?: string;
  category?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  const { message, companyId, companySlug } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      message: 'Message is required'
    });
  }

  if (!companyId && !companySlug) {
    return res.status(400).json({
      success: false,
      message: 'Company ID or slug is required'
    });
  }

  try {
    // Get company information
    let companyInfo;
    
    if (companySlug) {
      const result = await query(
        'SELECT * FROM companies WHERE slug = $1 LIMIT 1',
        [companySlug]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Company not found'
        });
      }
      companyInfo = result.rows[0];
    } else {
      const result = await query(
        'SELECT * FROM companies WHERE id = $1 LIMIT 1',
        [companyId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Company not found'
        });
      }
      companyInfo = result.rows[0];
    }

    // Generate AI response
    const [aiResponse, category] = await Promise.all([
      generateHVACResponse(message, companyInfo),
      categorizeCustomerMessage(message)
    ]);

    return res.status(200).json({
      success: true,
      response: aiResponse,
      category: category
    });
  } catch (error: any) {
    console.error('Error generating AI response:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate AI response: ' + error.message
    });
  }
}