import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host');
  
  console.log('🔥 MIDDLEWARE RUNNING for hostname:', hostname, 'path:', request.nextUrl.pathname);
  
  // Skip middleware for localhost and development domains
  if (!hostname || 
      hostname.includes('localhost') || 
      hostname.includes('.replit.dev') ||
      hostname.includes('replit.com')) {
    console.log('Skipping middleware for:', hostname);
    return NextResponse.next();
  }

  // Skip for main Vercel app domain and your business domains
  if (hostname === 'atlaswebsites.vercel.app' || 
      hostname === 'atlasgrowth.ai' ||
      hostname.includes('.vercel.app')) {
    console.log('Skipping middleware for main domain:', hostname);
    return NextResponse.next();
  }

  // Only proceed if this looks like a custom domain (not a vercel domain)
  console.log('Processing potential custom domain:', hostname);
  try {
    // Strip www from domain for database lookup
    const domainToLookup = hostname.startsWith('www.') ? hostname.substring(4) : hostname;
    console.log('Looking up domain:', domainToLookup, '(original:', hostname + ')');
    
    // Query database to find company with this custom domain
    // Use the current origin to avoid auth issues
    const response = await fetch(`${request.nextUrl.origin}/api/get-company-by-domain?domain=${domainToLookup}`, {
      headers: {
        'x-middleware': 'true'
      }
    });
    
    console.log('API response status:', response.status);
    
    if (response.ok) {
      const responseText = await response.text();
      console.log('Raw API response:', responseText.substring(0, 100));
      
      try {
        const company = JSON.parse(responseText);
        console.log('Found company:', company);
        
        if (company && company.slug) {
          // Rewrite to the company's template page
          const url = request.nextUrl.clone();
          url.pathname = `/t/moderntrust/${company.slug}`;
          
          console.log('Rewriting to:', url.pathname);
          
          // Pass the custom domain info to the page
          const rewriteResponse = NextResponse.rewrite(url);
          rewriteResponse.headers.set('x-custom-domain', hostname);
          rewriteResponse.headers.set('x-company-slug', company.slug);
          
          return rewriteResponse;
        }
      } catch (parseError) {
        console.log('JSON parse error:', parseError);
        console.log('Response was HTML, not JSON:', responseText.substring(0, 200));
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