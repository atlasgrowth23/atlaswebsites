import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '../../../../lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      companySlug, 
      messageId, 
      name, 
      phone, 
      email, 
      notes, 
      serviceType 
    } = body;
    
    if (!companySlug || !messageId || !name || !phone) {
      return NextResponse.json(
        { error: 'Required fields missing' },
        { status: 400 }
      );
    }
    
    // Get company ID
    const company = await queryOne(
      'SELECT id FROM companies WHERE slug = $1',
      [companySlug]
    );
    
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }
    
    // Get the message
    const message = await queryOne(
      'SELECT * FROM company_messages WHERE id = $1 AND company_id = $2',
      [messageId, company.id]
    );
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }
    
    // Start a database transaction
    await query('BEGIN');
    
    try {
      // Create or update contact
      const contactResult = await query(
        `INSERT INTO company_contacts
         (company_id, name, phone, email, notes)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (company_id, phone) 
         DO UPDATE SET 
           name = EXCLUDED.name,
           email = COALESCE(EXCLUDED.email, company_contacts.email),
           notes = CASE 
             WHEN company_contacts.notes IS NULL THEN EXCLUDED.notes
             WHEN EXCLUDED.notes IS NULL THEN company_contacts.notes
             ELSE company_contacts.notes || E'\\n\\n' || EXCLUDED.notes
           END
         RETURNING id`,
        [company.id, name, phone, email, notes]
      );
      
      const contactId = contactResult.rows[0].id;
      
      // Update the message with the contact ID
      await query(
        'UPDATE company_messages SET contact_id = $1 WHERE id = $2',
        [contactId, messageId]
      );
      
      // Create a new job
      await query(
        `INSERT INTO company_jobs
         (company_id, contact_id, service_type, status, notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [company.id, contactId, serviceType || 'custom', 'NEW', notes]
      );
      
      // Commit the transaction
      await query('COMMIT');
      
      return NextResponse.json(
        { success: true, contactId },
        { status: 200 }
      );
    } catch (error) {
      // Rollback in case of error
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error converting message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}