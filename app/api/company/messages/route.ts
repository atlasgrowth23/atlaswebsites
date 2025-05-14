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
    
    // Get messages with contact info if available
    const messages = await queryMany(`
      SELECT 
        m.id, 
        m.company_id, 
        m.contact_id, 
        m.direction, 
        m.body, 
        m.service_type, 
        m.ts,
        c.name as contact_name,
        c.phone as contact_phone
      FROM company_messages m
      LEFT JOIN company_contacts c ON m.contact_id = c.id
      WHERE m.company_id = $1
      ORDER BY m.ts DESC
      LIMIT 50
    `, [company.id]);
    
    return NextResponse.json(
      { messages },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}