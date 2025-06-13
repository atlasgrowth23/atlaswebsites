import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { company_id, owner_name, owner_email } = req.body;

    if (!company_id) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    if (!owner_email) {
      return res.status(400).json({ error: 'Owner email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(owner_email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const client = await pool.connect();
    
    try {
      // Update the companies table with owner information
      const result = await client.query(`
        UPDATE companies 
        SET 
          owner_name = COALESCE($2, owner_name),
          owner_email = $3,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [company_id, owner_name, owner_email]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Company not found' });
      }

      console.log(`✅ Updated contact in companies table: ${owner_email} for company: ${company_id}`);

      return res.status(200).json({
        success: true,
        message: 'Contact updated successfully in companies table',
        contact: {
          company_id: result.rows[0].id,
          company_name: result.rows[0].name,
          owner_name: result.rows[0].owner_name,
          owner_email: result.rows[0].owner_email
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Add email API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}