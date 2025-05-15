import { NextApiRequest, NextApiResponse } from 'next';
import { query, queryMany } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET': {
        // Get company_id from query params
        const { company_id } = req.query;
        
        if (!company_id) {
          return res.status(400).json({ error: 'company_id is required' });
        }
        
        // Fetch contacts for this company
        const contacts = await queryMany(`
          SELECT 
            id, company_id, name, phone, email, street, city, notes, 
            COALESCE(created_at, NOW()) as created_at
          FROM company_contacts 
          WHERE company_id = $1
          ORDER BY name
        `, [company_id]);
        
        // Process the contacts to add UI-specific fields
        const processedContacts = contacts.map((contact: any) => ({
          ...contact,
          customer_since: new Date(contact.created_at).toISOString().split('T')[0],
          type: contact.notes?.includes('commercial') ? 'commercial' : 'residential'
        }));
        
        return res.status(200).json(processedContacts);
      }
      
      case 'POST': {
        // Create a new contact
        const { company_id, name, phone, email, street, city, notes, type } = req.body;
        
        if (!company_id || !name) {
          return res.status(400).json({ error: 'company_id and name are required' });
        }
        
        // Add type information to notes if provided
        const processedNotes = type === 'commercial' 
          ? `${notes ? notes + '; ' : ''}commercial customer` 
          : notes;
        
        // Insert the new contact
        const result = await query(`
          INSERT INTO company_contacts (id, company_id, name, phone, email, street, city, notes, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          RETURNING *
        `, [uuidv4(), company_id, name, phone, email, street, city, processedNotes]);
        
        if (result.rowCount === 0) {
          throw new Error('Failed to create contact');
        }
        
        const newContact = {
          ...result.rows[0],
          customer_since: new Date(result.rows[0].created_at).toISOString().split('T')[0],
          type: type || 'residential'
        };
        
        return res.status(201).json(newContact);
      }
      
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error: any) {
    console.error('API error:', error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}