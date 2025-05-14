import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      name, 
      email, 
      phone, 
      message, 
      initialMessage,
      street,
      service,
      companySlug, 
      leadType, 
      timestamp 
    } = req.body;
    
    // Combine message fields
    const finalMessage = message || initialMessage || '';

    // Validate required fields
    if (!name || !email || !phone || !companySlug) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }

    // First, get company id from slug
    const companyResult = await query(
      'SELECT id FROM companies WHERE slug = $1 LIMIT 1',
      [companySlug]
    );

    if (companyResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Company not found' 
      });
    }

    const companyId = companyResult.rows[0].id;

    // Try to store the lead in the database
    try {
      // Check if leads table exists
      const tableCheck = await query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'leads'
        )`
      );
      
      const tableExists = tableCheck.rows[0].exists;
      
      if (!tableExists) {
        // Create a minimal leads table if it doesn't exist
        await query(`
          CREATE TABLE IF NOT EXISTS leads (
            id SERIAL PRIMARY KEY,
            company_id INTEGER NOT NULL,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(50) NOT NULL,
            message TEXT,
            street VARCHAR(255),
            service VARCHAR(50),
            lead_type VARCHAR(50),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            status VARCHAR(50) DEFAULT 'new',
            CONSTRAINT fk_company
              FOREIGN KEY(company_id)
              REFERENCES companies(id)
              ON DELETE CASCADE
          )
        `);
        
        console.log('Created leads table for widget lead collection');
      }
      
      // Save lead to database
      const result = await query(
        `INSERT INTO leads (
          company_id, 
          name, 
          email, 
          phone, 
          message, 
          street,
          service,
          lead_type, 
          created_at,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [
          companyId,
          name,
          email,
          phone,
          finalMessage,
          street || '',
          service || '',
          leadType || service || 'website',
          timestamp || new Date().toISOString(),
          'new'
        ]
      );

      const leadId = result.rows[0].id;
      return res.status(200).json({ 
        success: true, 
        message: 'Lead successfully submitted',
        leadId
      });
      
    } catch (dbError) {
      console.error('Database error processing lead:', dbError);
      
      // Still return success to the client, but log the issue server-side
      // This provides a good user experience even if DB had issues
      return res.status(200).json({ 
        success: true, 
        message: 'Lead received (but note: database storage issue)',
        stored: false
      });
    }
    
  } catch (error) {
    console.error('Error saving lead:', error);
    return res.status(500).json({ 
      error: 'Failed to process lead' 
    });
  }
}