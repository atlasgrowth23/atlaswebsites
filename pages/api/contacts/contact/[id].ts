// pages/api/contacts/contact/[id].ts
import { NextApiRequest, NextApiResponse } from "next";
import { queryOne, query } from "../../../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing contact ID' });
  }

  try {
    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        // Get a specific contact
        const contact = await queryOne('SELECT * FROM company_contacts WHERE id = $1', [id]);
        
        if (!contact) {
          return res.status(404).json({ error: 'Contact not found' });
        }
        
        return res.status(200).json(contact);
        
      case 'PUT':
        // Update a contact
        const { name, email, phone, street, city, notes } = req.body;
        
        if (!name) {
          return res.status(400).json({ error: 'Name is required' });
        }
        
        const updatedContact = await queryOne(
          `UPDATE company_contacts 
           SET name = $1, email = $2, phone = $3, street = $4, city = $5, notes = $6
           WHERE id = $7
           RETURNING *`,
          [name, email || null, phone || null, street || null, city || null, notes || null, id]
        );
        
        if (!updatedContact) {
          return res.status(404).json({ error: 'Contact not found' });
        }
        
        return res.status(200).json(updatedContact);
        
      case 'DELETE':
        // Delete a contact
        const deletedContact = await queryOne(
          'DELETE FROM company_contacts WHERE id = $1 RETURNING *',
          [id]
        );
        
        if (!deletedContact) {
          return res.status(404).json({ error: 'Contact not found' });
        }
        
        return res.status(200).json({ message: 'Contact deleted successfully' });
        
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error handling contact:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}