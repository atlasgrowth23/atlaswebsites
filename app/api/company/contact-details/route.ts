import { NextRequest, NextResponse } from 'next/server';
import { queryMany } from '../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get contact ID from query parameter
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');
    
    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      );
    }
    
    // Get equipment for the contact
    const equipment = await queryMany(
      `SELECT 
        id, 
        type, 
        brand, 
        model, 
        install_year, 
        serial 
      FROM company_equipment
      WHERE contact_id = $1
      ORDER BY type, brand`,
      [contactId]
    );
    
    // Get jobs for the contact
    const jobs = await queryMany(
      `SELECT 
        id, 
        service_type, 
        status, 
        priority, 
        scheduled_at, 
        notes 
      FROM company_jobs
      WHERE contact_id = $1
      ORDER BY 
        CASE 
          WHEN status = 'DONE' THEN 4
          WHEN status = 'PROGRESS' THEN 3
          WHEN status = 'SCHEDULED' THEN 2
          WHEN status = 'NEW' THEN 1
        END,
        COALESCE(scheduled_at, NOW()) DESC`,
      [contactId]
    );
    
    return NextResponse.json(
      { equipment, jobs },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching contact details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}