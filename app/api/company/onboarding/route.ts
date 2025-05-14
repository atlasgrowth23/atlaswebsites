import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      companySlug, 
      brandColor, 
      accentColor, 
      multiTech, 
      techCount, 
      scheduleOrigin 
    } = body;

    if (!companySlug) {
      return NextResponse.json(
        { error: 'Company slug is required' }, 
        { status: 400 }
      );
    }

    // Update company settings
    await query(
      `UPDATE companies 
       SET brand_color = $1, 
           accent_color = $2, 
           multi_tech = $3,
           settings = settings || $4::jsonb
       WHERE slug = $5`,
      [
        brandColor, 
        accentColor, 
        multiTech, 
        JSON.stringify({ schedule_origin: scheduleOrigin }),
        companySlug
      ]
    );

    // If multiTech is true, create tech users
    if (multiTech && techCount > 1) {
      // Get company ID
      const companyResult = await query(
        'SELECT id FROM companies WHERE slug = $1',
        [companySlug]
      );
      
      if (companyResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Company not found' },
          { status: 404 }
        );
      }
      
      const companyId = companyResult.rows[0].id;
      
      // Create tech users (number based on techCount)
      for (let i = 1; i <= Math.min(techCount, 5); i++) {
        await query(
          `INSERT INTO company_users 
           (company_id, name, email, role, invite_status) 
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (company_id, email) DO NOTHING`,
          [
            companyId,
            `Tech ${i}`,
            `tech${i}@${companySlug}.test`,
            'tech',
            'pending'
          ]
        );
      }
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}