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
  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getContacts(req, res);
    case 'POST':
      return createContact(req, res);
    default:
      return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}

async function getContacts(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Normalize the company_id from either businessSlug or company_id parameter
  let company_id = req.query.businessSlug || req.query.company_id || '';
  
  if (!company_id || (Array.isArray(company_id) && company_id.length === 0)) {
    return res.status(400).json({
      success: false,
      message: 'Company ID or business slug is required'
    });
  }
  
  // Convert to string if it's an array
  if (Array.isArray(company_id)) {
    company_id = company_id[0];
  }

  try {
    // Get all contacts for this business
    const contactsResult = await query(`
      SELECT
        c.id,
        c.name,
        c.email,
        c.phone,
        c.address,
        c.city,
        c.state,
        c.zip,
        c.notes,
        c.last_service_date,
        c.created_at
      FROM
        hvac_contacts c
      WHERE
        c.company_id = $1
      ORDER BY
        c.name ASC
    `, [company_id]);

    return res.status(200).json({
      success: true,
      contacts: contactsResult.rows
    });
  } catch (error: any) {
    console.error('Error fetching contacts:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch contacts: ' + error.message
    });
  }
}

async function createContact(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Get data from request body
  const {
    name,
    email,
    phone,
    address,
    city,
    state,
    zip,
    notes,
    companyId,
    companySlug,
    businessSlug
  } = req.body;

  // Validate required fields
  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Name is required'
    });
  }

  // Determine company_id - first try direct companyId, then try to look up by slug
  let company_id = companyId;
  let slug_to_use = companySlug || businessSlug;

  // If we have a slug but no ID, look up the company ID from the slug
  if (!company_id && slug_to_use) {
    try {
      const companyResult = await query(`
        SELECT id FROM companies WHERE slug = $1
      `, [slug_to_use]);

      if (companyResult.rows.length === 0) {
        // If not found, just use the slug as the ID
        company_id = slug_to_use;
      } else {
        company_id = companyResult.rows[0].id;
      }
    } catch (error: any) {
      console.error('Error looking up company by slug:', error);
      // If there's an error, just use the slug as the ID
      company_id = slug_to_use;
    }
  }

  if (!company_id) {
    return res.status(400).json({
      success: false,
      message: 'Company ID is required'
    });
  }

  try {
    // Create new contact
    const result = await query(`
      INSERT INTO hvac_contacts (
        company_id,
        name,
        email,
        phone,
        address,
        city,
        state,
        zip,
        type,
        notes,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING id, name, email, phone, address, city, state, zip, type, notes, created_at
    `, [
      company_id,
      name,
      email,
      phone || null,
      address || null,
      city || null,
      state || null,
      zip || null,
      'residential', // Default to residential type
      notes || null
    ]);

    const newContact = result.rows[0];

    return res.status(201).json({
      success: true,
      message: 'Contact created successfully',
      contact: newContact
    });
  } catch (error: any) {
    console.error('Error creating contact:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to create contact: ' + error.message
    });
  }
}