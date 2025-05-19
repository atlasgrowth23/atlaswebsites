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
        // Get all messages for this company with session grouping
        const messages = await queryMany(
          `SELECT m.id, m.company_id, m.contact_id, m.body as message, 
                 m.direction, m.service_type, m.ts, m.session_id,
                 c.name as contact_name, c.email as contact_email, c.phone as contact_phone 
           FROM company_messages m
           LEFT JOIN company_contacts c ON m.contact_id = c.id
           WHERE m.company_id = $1 
           ORDER BY m.session_id, m.ts ASC`,
          [companyId]
        );
        
        // Group messages by conversation session
        const sessionsMap = new Map();
        
        messages.forEach(message => {
          const sessionId = message.session_id || 'unknown_session';
          
          if (!sessionsMap.has(sessionId)) {
            // Find the contact info for the session
            const contactInfo = {
              id: message.contact_id,
              name: message.contact_name || 'Website Visitor',
              email: message.contact_email || '',
              phone: message.contact_phone || '',
              has_details: !!(message.contact_email || message.contact_phone)
            };
            
            sessionsMap.set(sessionId, {
              session_id: sessionId,
              contact: contactInfo,
              messages: [],
              last_message_time: message.ts,
              last_message: message.message
            });
          }
          
          const session = sessionsMap.get(sessionId);
          session.messages.push(message);
          
          // Update last message time if this message is newer
          if (new Date(message.ts) > new Date(session.last_message_time)) {
            session.last_message_time = message.ts;
            session.last_message = message.message;
          }
          
          // If this message has contact info, update the session's contact info
          if (message.contact_name || message.contact_email || message.contact_phone) {
            session.contact = {
              id: message.contact_id,
              name: message.contact_name || session.contact.name,
              email: message.contact_email || session.contact.email,
              phone: message.contact_phone || session.contact.phone,
              has_details: !!(message.contact_email || message.contact_phone || session.contact.has_details)
            };
          }
        });
        
        // Convert to array and sort sessions by most recent message
        const sessions = Array.from(sessionsMap.values()).sort((a, b) => {
          return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
        });
        
        return res.status(200).json({
          sessions,
          messages // Also return flat messages for backward compatibility
        });
        
      case 'POST':
        // Create a new message from website
        const { name, email, phone, message } = req.body;
        
        if (!name || !message) {
          return res.status(400).json({ error: 'Name and message are required' });
        }
        
        // Check if contact exists
        let contactId = null;
        let isNewContact = false;
        
        if (email || phone) {
          const existingContact = await queryOne(
            'SELECT id FROM company_contacts WHERE company_id = $1 AND (email = $2 OR phone = $3)',
            [companyId, email || null, phone || null]
          );
          
          if (existingContact) {
            contactId = existingContact.id;
          } else {
            // Create a new contact
            const contactUuid = uuidv4();
            const newContact = await queryOne(
              `INSERT INTO company_contacts (id, company_id, name, email, phone) 
               VALUES ($1, $2, $3, $4, $5) 
               RETURNING id`,
              [contactUuid, companyId, name, email || null, phone || null]
            );
            contactId = newContact.id;
            isNewContact = true;
            
            // If a new contact was created with email/phone, update any previous messages 
            // from this session to link to this contact
            if (req.body.session_id) {
              await query(
                `UPDATE company_messages 
                 SET contact_id = $1 
                 WHERE company_id = $2 
                 AND session_id = $3 
                 AND contact_id IS NULL`,
                [contactId, companyId, req.body.session_id]
              );
            }
          }
        }
        
        // Store the message with session tracking
        const messageId = uuidv4();
        const sessionId = req.body.session_id || uuidv4(); // Use provided session_id or generate a new one
        
        const newMessage = await queryOne(
          `INSERT INTO company_messages (id, company_id, contact_id, body, direction, service_type, ts, session_id) 
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7) 
           RETURNING *`,
          [messageId, companyId, contactId, message, 'in', 'website_chat', sessionId]
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