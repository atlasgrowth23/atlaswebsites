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
      message: 'Method not allowed'
    });
  }

  const { businessSlug, templateKey } = req.body;

  // Validate inputs
  if (!businessSlug || !templateKey) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: businessSlug and templateKey'
    });
  }

  try {
    // Update the 'site' column in the companies table to the selected template
    await query(`
      UPDATE companies 
      SET 
        site = $1,
        updated_at = NOW()
      WHERE 
        slug = $2
    `, [templateKey, businessSlug]);

    // Revalidate the template page (if using ISR)
    try {
      await fetch(`/api/revalidate-template?slug=${businessSlug}&template=${templateKey}`);
    } catch (revalidateError) {
      console.error('Error revalidating template:', revalidateError);
      // Continue anyway, this is not critical
    }

    return res.status(200).json({
      success: true,
      message: 'Template updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating template:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
}