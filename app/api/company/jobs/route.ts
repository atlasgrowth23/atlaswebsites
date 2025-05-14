import { NextRequest, NextResponse } from 'next/server';
import { queryMany, queryOne } from '../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get company slug and date from query parameters
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const date = searchParams.get('date'); // Format: YYYY-MM-DD
    const contactId = searchParams.get('contactId');
    
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
    
    // Base query
    let jobsQuery = `
      SELECT 
        j.id, 
        j.contact_id,
        j.tech_id,
        j.service_type,
        j.status,
        j.priority,
        j.scheduled_at,
        j.notes,
        c.name as contact_name,
        c.phone as contact_phone
      FROM company_jobs j
      JOIN company_contacts c ON j.contact_id = c.id
      WHERE j.company_id = $1
    `;
    
    const queryParams: any[] = [company.id];
    let paramIndex = 2;
    
    // Add date filter if provided
    if (date) {
      // Convert date parameter to start and end of day
      const startOfDay = `${date}T00:00:00.000Z`;
      const endOfDay = `${date}T23:59:59.999Z`;
      
      jobsQuery += ` AND (
        (j.scheduled_at BETWEEN $${paramIndex} AND $${paramIndex + 1}) OR 
        (j.scheduled_at IS NULL AND j.status IN ('NEW', 'PROGRESS'))
      )`;
      
      queryParams.push(startOfDay, endOfDay);
      paramIndex += 2;
    }
    
    // Add contact filter if provided
    if (contactId) {
      jobsQuery += ` AND j.contact_id = $${paramIndex}`;
      queryParams.push(contactId);
      paramIndex += 1;
    }
    
    // Add ordering
    jobsQuery += `
      ORDER BY 
        j.status = 'DONE' ASC,
        j.priority = 'emergency' DESC,
        COALESCE(j.scheduled_at, NOW()) ASC
    `;
    
    // Get jobs
    const jobs = await queryMany(jobsQuery, queryParams);
    
    return NextResponse.json(
      { jobs },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}