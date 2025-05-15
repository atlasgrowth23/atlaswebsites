import { NextApiRequest, NextApiResponse } from 'next';
import { queryOne } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  try {
    const { slug } = req.query;
    
    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Company slug is required' 
      });
    }
    
    // Find the company by slug
    const company = await queryOne(
      'SELECT * FROM companies WHERE slug = $1',
      [slug]
    );
    
    if (!company) {
      return res.status(404).json({ 
        success: false, 
        message: 'Company not found' 
      });
    }
    
    console.log(`Found company: ${company.name} for slug: ${slug}`);
    
    return res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Error fetching company by slug:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}