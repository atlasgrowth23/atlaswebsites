// pages/api/messages/[slug].ts
import { NextApiRequest, NextApiResponse } from "next";
import { queryMany, queryOne, query } from "../../../lib/db";
import { v4 as uuidv4 } from 'uuid';

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
        // Get all messages for this company
        const messages = await queryMany(
          `SELECT m.id, m.company_id, m.contact_id, m.body as message, 
                 m.direction, m.service_type, m.ts,
                 c.name as contact_name, c.email as contact_email, c.phone as contact_phone 
           FROM company_messages m
           LEFT JOIN company_contacts c ON m.contact_id = c.id
           WHERE m.company_id = $1 
           ORDER BY m.ts DESC`,
          [companyId]
        );
        return res.status(200).json(messages);
        
      case 'POST':
        // Create a new message from website
        const { name, email, phone, message } = req.body;
        
        if (!name || !message) {
          return res.status(400).json({ error: 'Name and message are required' });
        }
        
        // Check if contact exists
        let contactId = null;
        if (email || phone) {
          const existingContact = await queryOne(
            'SELECT id FROM company_contacts WHERE company_id = $1 AND (email = $2 OR phone = $3)',
            [companyId, email || null, phone || null]
          );
          
          if (existingContact) {
            contactId = existingContact.id;
          } else {
            // Create a new contact
            const newContact = await queryOne(
              `INSERT INTO company_contacts (id, company_id, name, email, phone) 
               VALUES ($1, $2, $3, $4, $5) 
               RETURNING id`,
              [uuidv4(), companyId, name, email || null, phone || null]
            );
            contactId = newContact.id;
          }
        }
        
        // Store the message
        const messageId = uuidv4();
        const newMessage = await queryOne(
          `INSERT INTO company_messages (id, company_id, contact_id, body, direction, service_type, ts) 
           VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
           RETURNING *`,
          [messageId, companyId, contactId, message, 'in', 'website_chat']
        );
        
        return res.status(201).json(newMessage);
        
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error handling messages:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}