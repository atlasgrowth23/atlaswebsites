import { NextApiRequest, NextApiResponse } from 'next';
import { queryMany } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Fetch all companies with their status information
      const companies = await queryMany(`
        SELECT 
          c.id, 
          c.name, 
          c.slug,
          c.city,
          c.state,
          c.phone,
          c.email,
          c.rating,
          c.reviews,
          c.created_at,
          COALESCE(c.status, 'new') as status,
          c.last_contact,
          (
            SELECT MAX(pv.created_at) 
            FROM portal_views pv 
            WHERE pv.company_id = c.id
          ) as last_viewed,
          c.notes
        FROM companies c
        ORDER BY 
          CASE 
            WHEN c.status = 'new' THEN 1
            WHEN c.status = 'contacted' THEN 2
            WHEN c.status = 'site_sent' THEN 3
            WHEN c.status = 'viewed' THEN 4
            WHEN c.status = 'follow_up' THEN 5
            WHEN c.status = 'converted' THEN 6
            WHEN c.status = 'lost' THEN 7
            ELSE 8
          END,
          c.name ASC
      `);
      
      return res.status(200).json(companies);
    }
    
    return res.status(405).end('Method Not Allowed');
  } catch (error) {
    console.error('Error fetching companies:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}