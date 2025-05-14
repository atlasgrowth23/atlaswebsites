import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '../../../../lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      companySlug, 
      contactId, 
      type, 
      brand, 
      model, 
      install_year, 
      serial 
    } = body;
    
    if (!companySlug || !contactId || !brand || !model) {
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
    
    // Verify contact belongs to company
    const contact = await queryOne(
      'SELECT id FROM company_contacts WHERE id = $1 AND company_id = $2',
      [contactId, company.id]
    );
    
    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found or does not belong to this company' },
        { status: 404 }
      );
    }
    
    // Insert new equipment
    const result = await query(
      `INSERT INTO company_equipment
        (company_id, contact_id, type, brand, model, install_year, serial)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        company.id,
        contactId,
        type || null,
        brand,
        model,
        install_year || null,
        serial || null
      ]
    );
    
    const equipmentId = result.rows[0].id;
    
    return NextResponse.json(
      { success: true, equipmentId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding equipment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}