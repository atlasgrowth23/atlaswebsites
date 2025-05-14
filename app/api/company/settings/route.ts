import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get company slug from query parameters
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Company slug is required' },
        { status: 400 }
      );
    }
    
    // Get company settings
    const company = await queryOne(`
      SELECT 
        id, 
        name, 
        brand_color, 
        accent_color, 
        multi_tech, 
        settings
      FROM companies 
      WHERE slug = $1
    `, [slug]);
    
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(company, { status: 200 });
  } catch (error) {
    console.error('Error fetching company settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}