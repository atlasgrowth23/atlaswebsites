// pages/api/contacts/[slug].ts
import { NextApiRequest, NextApiResponse } from "next";
import { queryMany, queryOne, query } from "../../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;
  
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Missing company slug' });
  }

  try {
    // Get company ID from slug
    const company = await queryOne('SELECT id FROM companies WHERE slug = $1', [slug]);
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const companyId = company.id;

    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        // Get all contacts for this company
        const contacts = await queryMany(
          'SELECT * FROM company_contacts WHERE company_id = $1 ORDER BY name ASC',
          [companyId]
        );
        return res.status(200).json(contacts);
        
      case 'POST':
        // Create a new contact
        const { name, email, phone, street, city, notes } = req.body;
        
        if (!name) {
          return res.status(400).json({ error: 'Name is required' });
        }
        
        const newContact = await queryOne(
          `INSERT INTO company_contacts (company_id, name, email, phone, street, city, notes) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) 
           RETURNING *`,
          [companyId, name, email || null, phone || null, street || null, city || null, notes || null]
        );
        
        return res.status(201).json(newContact);
        
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error handling contacts:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}