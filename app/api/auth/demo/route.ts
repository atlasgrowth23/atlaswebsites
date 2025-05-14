import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { queryOne } from '../../../../lib/db';

// Function to generate a JWT for demo access
async function generateToken(companyId: string, companySlug: string) {
  // Create a new JWT that expires in 30 days
  const expirationTime = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30; // 30 days
  
  // Secret key for signing JWT
  const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || 'demo_secret_key_replace_in_production');
  
  // Create and sign the JWT
  const token = await new SignJWT({
    companyId,
    companySlug,
    role: 'owner',
    demo: true,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(expirationTime)
    .setIssuedAt()
    .setNotBefore(Math.floor(Date.now() / 1000))
    .sign(secretKey);
  
  return token;
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { companySlug } = body;
    
    if (!companySlug) {
      return NextResponse.json(
        { error: 'Company slug is required' },
        { status: 400 }
      );
    }
    
    // Get company info from database
    const company = await queryOne(
      'SELECT id, name, slug, plan FROM companies WHERE slug = $1',
      [companySlug]
    );
    
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }
    
    // Verify company is in 'prospect' or 'trial' plan
    if (company.plan !== 'prospect' && company.plan !== 'trial') {
      return NextResponse.json(
        { error: 'Demo mode not available for this company' },
        { status: 403 }
      );
    }
    
    // Generate a demo JWT token
    const token = await generateToken(company.id, company.slug);
    
    // Create the response
    const response = NextResponse.json(
      { success: true, companyName: company.name },
      { status: 200 }
    );
    
    // Set the JWT as a cookie
    response.cookies.set({
      name: 'hvac_portal_auth',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Demo auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}