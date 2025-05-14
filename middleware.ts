import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Regex for matching subdomains
const SUBDOMAIN_REGEX = /^\/t\/([^\/]+)\/([^\/]+)/;

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = url;
  
  // Check for subdomain paths like /t/templateKey/slug
  const subdomainMatch = pathname.match(SUBDOMAIN_REGEX);
  
  if (subdomainMatch) {
    // Already using the template route format, let it pass through
    return NextResponse.next();
  }
  
  // Check for portal routes that need authentication
  if (pathname.startsWith('/portal') && 
      !pathname.startsWith('/portal/login')) {
    // Check if user is logged in via cookie/localStorage
    // Note: Edge middleware can only access cookies, not localStorage
    // For a real implementation, you would use JWT tokens in cookies
    
    // For now, we'll pass through and let the client-side code handle auth redirects
    return NextResponse.next();
  }
  
  // For API and sales dashboard, always pass through
  if (pathname.startsWith('/api/') || 
      pathname.startsWith('/sales')) {
    return NextResponse.next();
  }
  
  // Check if the hostname might be a custom domain
  const hostname = request.headers.get('host');
  if (!hostname) return NextResponse.next();
  
  // Skip middleware on localhost and Vercel preview URLs
  if (
    hostname.includes('localhost') || 
    hostname.includes('vercel.app') || 
    hostname.includes('replit.dev') || 
    hostname.includes('repl.co') ||
    hostname === process.env.PRIMARY_DOMAIN
  ) {
    // Pass through to normal routing
    return NextResponse.next();
  }
  
  try {
    // This is possibly a custom domain - redirect to API to handle
    url.pathname = `/api/domain-handler`;
    url.search = `?domain=${encodeURIComponent(hostname)}&path=${encodeURIComponent(pathname)}`;
    return NextResponse.rewrite(url);
  } catch (e) {
    console.error('Middleware error:', e);
    return NextResponse.next();
  }
}

// Matching all routes except for API routes, static files, etc.
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /static (static files)
     * 4. All files with extensions (e.g. favicon.ico)
     */
    '/((?!api|_next|static|favicon.ico|.*\\..*).*)',
  ],
};