import { NextApiRequest, NextApiResponse } from 'next';
import { queryMany } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    if (method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }

    const { slug } = req.query;
    
    if (!slug) {
      return res.status(400).json({ error: 'slug is required' });
    }
    
    // Get the company by slug
    const companies = await queryMany(`
      SELECT id, name, slug, city, state, site as website, logo  
      FROM companies 
      WHERE slug = $1 LIMIT 1
    `, [slug]);
    
    if (companies.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    return res.status(200).json(companies[0]);
  } catch (error: any) {
    console.error('API error:', error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}