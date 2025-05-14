import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      name,
      email,
      phone,
      message,
      companySlug,
      leadType = 'widget',
      timestamp
    } = req.body;

    // Validation
    if (!name || !email || !phone || !companySlug) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get company ID from slug
    let companyId;
    try {
      const company = await query(
        'SELECT id FROM companies WHERE slug = $1 LIMIT 1',
        [companySlug]
      );
      
      if (company.rows.length === 0) {
        return res.status(404).json({ error: 'Company not found' });
      }
      
      companyId = company.rows[0].id;
    } catch (error) {
      console.error('Error finding company:', error);
      // Return success anyway so the widget doesn't break
      return res.status(200).json({ success: true, stored: false });
    }

    // Insert lead into database
    try {
      await query(
        `INSERT INTO leads (company_id, name, email, phone, message, lead_type, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [companyId, name, email, phone, message || '', leadType, new Date()]
      );
    } catch (error) {
      console.error('Error inserting lead:', error);
      // Return success anyway so the widget doesn't break
      return res.status(200).json({ success: true, stored: false });
    }

    // Return success
    return res.status(200).json({ success: true, stored: true });
  } catch (error) {
    console.error('Error in lead API:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}