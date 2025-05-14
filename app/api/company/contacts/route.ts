import { NextRequest, NextResponse } from 'next/server';
import { queryMany, queryOne } from '../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get company slug from query parameter
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Company slug is required' },
        { status: 400 }
      );
    }
    
    // Get company ID
    const company = await queryOne(
      'SELECT id FROM companies WHERE slug = $1',
      [slug]
    );
    
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }
    
    // Get contacts
    const contacts = await queryMany(
      `SELECT 
        id, 
        name, 
        phone, 
        email, 
        street, 
        city, 
        notes 
      FROM company_contacts
      WHERE company_id = $1
      ORDER BY name ASC`,
      [company.id]
    );
    
    return NextResponse.json(
      { contacts },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}