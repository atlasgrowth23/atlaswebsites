import { NextApiRequest, NextApiResponse } from 'next';
import { query, queryOne } from '../../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid company ID' });
  }
  
  try {
    // GET - Fetch a single company
    if (req.method === 'GET') {
      const company = await queryOne(`
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
          c.notes,
          (
            SELECT MAX(pv.created_at) 
            FROM portal_views pv 
            WHERE pv.company_id = c.id
          ) as last_viewed
        FROM companies c
        WHERE c.id = $1
      `, [id]);
      
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }
      
      return res.status(200).json(company);
    }
    
    // PUT - Update company
    if (req.method === 'PUT') {
      const { status, notes, last_contact } = req.body;
      
      // Get current company to verify it exists
      const existingCompany = await queryOne('SELECT id FROM companies WHERE id = $1', [id]);
      
      if (!existingCompany) {
        return res.status(404).json({ message: 'Company not found' });
      }
      
      // Update company details
      const updatedCompany = await queryOne(`
        UPDATE companies
        SET 
          status = $1,
          notes = $2,
          last_contact = $3
        WHERE id = $4
        RETURNING *
      `, [
        status || 'new',
        notes || '',
        last_contact ? new Date(last_contact) : null,
        id
      ]);
      
      return res.status(200).json(updatedCompany);
    }
    
    // Method not allowed
    return res.status(405).end('Method Not Allowed');
    
  } catch (error) {
    console.error('Error handling company operation:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}