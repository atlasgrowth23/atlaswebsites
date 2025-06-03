import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host');
  
  console.log('Middleware triggered for hostname:', hostname);
  
  // Skip middleware for localhost and Vercel/Replit domains
  if (!hostname || 
      hostname.includes('localhost') || 
      hostname.includes('.vercel.app') || 
      hostname.includes('.replit.dev') ||
      hostname.includes('replit.com')) {
    console.log('Skipping middleware for:', hostname);
    return NextResponse.next();
  }

  // This is a custom domain - find which business it belongs to
  try {
    // Query database to find company with this custom domain
    // Use your main Vercel domain for API calls
    const apiOrigin = hostname.includes('.vercel.app') ? request.nextUrl.origin : 'https://atlaswebsites.vercel.app';
    const response = await fetch(`${apiOrigin}/api/get-company-by-domain?domain=${hostname}`, {
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
    // Skip internal Next.js routes
    '/((?!_next|api|favicon.ico|logos|stock).*)',
  ],
};