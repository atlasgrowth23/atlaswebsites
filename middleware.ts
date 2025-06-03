import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host');
  
  console.log('🔥 MIDDLEWARE RUNNING for hostname:', hostname, 'path:', request.nextUrl.pathname);
  
  console.log('Processing custom domain:', hostname);
  
  // Skip middleware for localhost and development domains only
  if (!hostname || 
      hostname.includes('localhost') || 
      hostname.includes('.replit.dev') ||
      hostname.includes('replit.com')) {
    console.log('Skipping middleware for:', hostname);
    return NextResponse.next();
  }

  // Skip for main Vercel app domain but allow custom domains
  if (hostname === 'atlaswebsites.vercel.app') {
    console.log('Skipping middleware for main Vercel domain:', hostname);
    return NextResponse.next();
  }

  // This is a custom domain - find which business it belongs to
  try {
    // Query database to find company with this custom domain
    // Use the current origin to avoid auth issues
    const response = await fetch(`${request.nextUrl.origin}/api/get-company-by-domain?domain=${hostname}`, {
      headers: {
        'x-middleware': 'true'
      }
    });
    
    console.log('API response status:', response.status);
    
    if (response.ok) {
      const company = await response.json();
      console.log('Found company:', company);
      
      if (company) {
        // Rewrite to the company's template page
        const url = request.nextUrl.clone();
        url.pathname = `/t/moderntrust/${company.slug}`;
        
        console.log('Rewriting to:', url.pathname);
        
        // Pass the custom domain info to the page
        const response = NextResponse.rewrite(url);
        response.headers.set('x-custom-domain', hostname);
        response.headers.set('x-company-slug', company.slug);
        
        return response;
      }
    } else {
      console.log('API call failed:', await response.text());
    }
  } catch (error) {
    console.error('Middleware error:', error);
  }

  // If no matching company found, continue normally
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|logos|stock).*)',
    // Explicitly match root
    '/',
  ],
};