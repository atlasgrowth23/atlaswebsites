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
    
    // Get technicians for the company
    const techs = await queryMany(
      `SELECT 
        id, 
        name, 
        email, 
        phone, 
        avatar_url 
      FROM company_users
      WHERE company_id = $1 AND role = 'tech' AND invite_status = 'accepted'
      ORDER BY name`,
      [company.id]
    );
    
    // Also include the owner as a tech for scheduling purposes
    const owner = await queryOne(
      `SELECT 
        id, 
        name, 
        email, 
        phone, 
        avatar_url 
      FROM company_users
      WHERE company_id = $1 AND role = 'owner'
      LIMIT 1`,
      [company.id]
    );
    
    let allTechs = [...techs];
    if (owner) {
      allTechs.unshift(owner);
    }
    
    return NextResponse.json(
      { techs: allTechs },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching technicians:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}