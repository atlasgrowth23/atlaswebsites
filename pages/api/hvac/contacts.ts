import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

type ResponseData = {
  success: boolean;
  message?: string;
  contacts?: any[];
  contact?: any;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getContacts(req, res);
    case 'POST':
      return createContact(req, res);
    case 'PUT':
      return updateContact(req, res);
    case 'DELETE':
      return deleteContact(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  }
}

// Get all contacts for a company or a single contact if id is provided
async function getContacts(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { company_id, id, type } = req.query;

  if (!company_id) {
    return res.status(400).json({ success: false, message: 'Company ID is required' });
  }

  try {
    let sql;
    let params;

    if (id) {
      // Get a single contact
      sql = `
        SELECT c.*, 
              (SELECT COUNT(*) FROM hvac_equipment e WHERE e.contact_id = c.id) as equipment_count
        FROM hvac_contacts c
        WHERE c.company_id = $1 AND c.id = $2
      `;
      params = [company_id, id];
      
      const result = await query(sql, params);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Contact not found' });
      }
      
      return res.status(200).json({ success: true, contact: result.rows[0] });
    } else {
      // Get all contacts with optional type filter
      sql = `
        SELECT c.*, 
              (SELECT COUNT(*) FROM hvac_equipment e WHERE e.contact_id = c.id) as equipment_count
        FROM hvac_contacts c
        WHERE c.company_id = $1
        ${type ? 'AND c.type = $2' : ''}
        ORDER BY c.name ASC
      `;
      params = type ? [company_id, type] : [company_id];
      
      const result = await query(sql, params);
      return res.status(200).json({ success: true, contacts: result.rows });
    }
  } catch (error: any) {
    console.error('Error fetching contacts:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Create a new contact
async function createContact(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { company_id, name, email, phone, address, city, state, zip, type, notes } = req.body;

  if (!company_id || !name) {
    return res.status(400).json({ success: false, message: 'Company ID and name are required' });
  }

  try {
    const sql = `
      INSERT INTO hvac_contacts (company_id, name, email, phone, address, city, state, zip, type, notes, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *
    `;

    const params = [company_id, name, email, phone, address, city, state, zip, type || 'residential', notes || ''];
    
    const result = await query(sql, params);
    return res.status(201).json({ success: true, contact: result.rows[0] });
  } catch (error: any) {
    console.error('Error creating contact:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Update a contact
async function updateContact(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { id, company_id, name, email, phone, address, city, state, zip, type, notes } = req.body;

  if (!id || !company_id) {
    return res.status(400).json({ success: false, message: 'Contact ID and Company ID are required' });
  }

  try {
    // Check if the contact exists and belongs to the company
    const checkSql = 'SELECT * FROM hvac_contacts WHERE id = $1 AND company_id = $2';
    const checkResult = await query(checkSql, [id, company_id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Contact not found or does not belong to this company' });
    }

    const sql = `
      UPDATE hvac_contacts
      SET name = $3,
          email = $4,
          phone = $5,
          address = $6,
          city = $7,
          state = $8,
          zip = $9,
          type = $10,
          notes = $11
      WHERE id = $1 AND company_id = $2
      RETURNING *
    `;

    const params = [id, company_id, name, email, phone, address, city, state, zip, type, notes];
    
    const result = await query(sql, params);
    return res.status(200).json({ success: true, contact: result.rows[0] });
  } catch (error: any) {
    console.error('Error updating contact:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Delete a contact
async function deleteContact(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { id, company_id } = req.body;

  if (!id || !company_id) {
    return res.status(400).json({ success: false, message: 'Contact ID and Company ID are required' });
  }

  try {
    // Check if the contact exists and belongs to the company
    const checkSql = 'SELECT * FROM hvac_contacts WHERE id = $1 AND company_id = $2';
    const checkResult = await query(checkSql, [id, company_id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Contact not found or does not belong to this company' });
    }

    // Check if there are any dependencies (jobs, equipment, invoices)
    const dependenciesSql = `
      SELECT
        (SELECT COUNT(*) FROM hvac_jobs WHERE customer_id = $1) as jobs_count,
        (SELECT COUNT(*) FROM hvac_equipment WHERE contact_id = $1) as equipment_count,
        (SELECT COUNT(*) FROM hvac_invoices WHERE contact_id = $1) as invoice_count
    `;
    const dependenciesResult = await query(dependenciesSql, [id]);
    const dependencies = dependenciesResult.rows[0];
    
    if (dependencies.jobs_count > 0 || dependencies.equipment_count > 0 || dependencies.invoice_count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete contact with existing jobs, equipment, or invoices' 
      });
    }

    const sql = 'DELETE FROM hvac_contacts WHERE id = $1 AND company_id = $2 RETURNING id';
    const result = await query(sql, [id, company_id]);
    
    return res.status(200).json({ 
      success: true, 
      message: `Contact ID ${result.rows[0].id} has been deleted successfully` 
    });
  } catch (error: any) {
    console.error('Error deleting contact:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}