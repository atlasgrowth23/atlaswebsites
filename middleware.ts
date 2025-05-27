import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host');
  
  // Skip middleware for localhost and Vercel/Replit domains
  if (!hostname || 
      hostname.includes('localhost') || 
      hostname.includes('.vercel.app') || 
      hostname.includes('.replit.dev') ||
      hostname.includes('replit.com')) {
    return NextResponse.next();
  }

  // This is a custom domain - find which business it belongs to
  try {
    // Query database to find company with this custom domain
    const response = await fetch(`${request.nextUrl.origin}/api/get-company-by-domain?domain=${hostname}`, {
      headers: {
        'x-middleware': 'true'
      }
    });
    
    if (response.ok) {
      const company = await response.json();
      
      if (company) {
        // Rewrite to the company's template page
        const url = request.nextUrl.clone();
        url.pathname = `/t/moderntrust/${company.slug}`;
        
        // Pass the custom domain info to the page
        const response = NextResponse.rewrite(url);
        response.headers.set('x-custom-domain', hostname);
        response.headers.set('x-company-slug', company.slug);
        
        return response;
      }
    }
  } catch (error) {
    console.error('Middleware error:', error);
  }

  // If no matching company found, continue normally
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip internal Next.js routes
    '/((?!_next|api|favicon.ico|logos|stock).*)',
  ],
};