import { NextApiRequest, NextApiResponse } from 'next';
import { query, queryOne } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const { companyId } = req.query;
        
        if (!companyId) {
          return res.status(400).json({ success: false, message: 'Company ID is required' });
        }

        const contacts = await query(
          'SELECT * FROM company_contacts WHERE company_id = $1 ORDER BY created_at DESC',
          [companyId]
        );

        return res.status(200).json({ success: true, data: contacts.rows });
      } catch (error) {
        console.error('Error fetching contacts:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
      }
    
    case 'POST':
      try {
        const { name, email, phone, street, city, type, notes, companyId } = req.body;
        
        if (!name || !companyId) {
          return res.status(400).json({ 
            success: false, 
            message: 'Name and company ID are required' 
          });
        }
        
        // Check if company exists
        const company = await queryOne(
          'SELECT id FROM companies WHERE id = $1',
          [companyId]
        );
        
        if (!company) {
          return res.status(404).json({ 
            success: false, 
            message: 'Company not found' 
          });
        }
        
        // Generate a new contact ID
        const contactId = uuidv4();
        
        // Insert the new contact
        const result = await query(
          `INSERT INTO company_contacts (
            id, company_id, name, email, phone, street, city, type, notes, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
          ) RETURNING *`,
          [
            contactId,
            companyId,
            name,
            email || null,
            phone || null,
            street || null,
            city || null,
            type || 'residential',
            notes || null
          ]
        );
        
        const newContact = result.rows[0];
        
        return res.status(201).json({ 
          success: true, 
          data: newContact,
          message: 'Contact created successfully' 
        });
      } catch (error) {
        console.error('Error creating contact:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Internal server error' 
        });
      }
      
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}