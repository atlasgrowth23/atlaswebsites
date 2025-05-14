import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '../../../../lib/db';

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { 
      companySlug, 
      brand_color, 
      accent_color, 
      multi_tech,
      settings
    } = requestData;
    
    if (!companySlug) {
      return NextResponse.json(
        { error: 'Company slug is required' },
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
    
    // Update company settings
    await query(`
      UPDATE companies
      SET 
        brand_color = $1,
        accent_color = $2,
        multi_tech = $3,
        settings = $4,
        updated_at = NOW()
      WHERE id = $5
    `, [
      brand_color,
      accent_color,
      multi_tech,
      settings,
      company.id
    ]);
    
    return NextResponse.json(
      { success: true, message: 'Settings updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating company settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}