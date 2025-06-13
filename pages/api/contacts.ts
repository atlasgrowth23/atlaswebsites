import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = await pool.connect();
    
    try {
      // Get all contacts from companies table where we have owner info
      const result = await client.query(`
        SELECT 
          c.id,
          c.name as company_name,
          c.owner_name,
          c.owner_email,
          c.phone,
          c.city,
          c.state,
          c.created_at,
          false as google_contact_created
        FROM companies c
        WHERE c.owner_name IS NOT NULL 
        AND c.owner_email IS NOT NULL
        AND c.owner_name != ''
        AND c.owner_email != ''
        ORDER BY c.updated_at DESC, c.created_at DESC
      `);

      const contacts = result.rows.map(row => ({
        id: row.id,
        company_name: row.company_name,
        owner_name: row.owner_name,
        owner_email: row.owner_email,
        phone: row.phone,
        city: row.city,
        state: row.state,
        created_at: row.created_at,
        google_contact_created: row.google_contact_created
      }));

      console.log(`✅ Fetched ${contacts.length} contacts`);

      res.json({ 
        success: true, 
        contacts,
        total: contacts.length
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch contacts',
      details: error.message 
    });
  }
}