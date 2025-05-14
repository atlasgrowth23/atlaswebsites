import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '../../../../lib/db';

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
    
    // Get company settings
    const company = await queryOne(
      `SELECT 
        id, 
        name, 
        brand_color, 
        accent_color, 
        multi_tech, 
        settings
      FROM companies
      WHERE slug = $1`,
      [slug]
    );
    
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }
    
    // Extract specific details we need about the company
    const companyDetails = {
      id: company.id,
      name: company.name,
      brand_color: company.brand_color || '#0077b6',
      accent_color: company.accent_color || '#00b4d8',
      multi_tech: company.multi_tech || false,
      settings: company.settings || {},
    };
    
    return NextResponse.json(companyDetails, { status: 200 });
  } catch (error) {
    console.error('Error fetching company settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}