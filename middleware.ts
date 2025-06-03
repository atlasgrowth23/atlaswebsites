import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host');
  
  // Skip internal domains
  if (!hostname || 
      hostname.includes('localhost') ||
      hostname.includes('vercel.app') ||
      hostname === 'atlasgrowth.ai') {
    return NextResponse.next();
  }

  try {
    // Get custom domains from Edge Config (super fast)
    const domainMap = await get('custom_domains') as Record<string, string> | null;
    
    if (domainMap && domainMap[hostname]) {
      const companySlug = domainMap[hostname];
      
      // Rewrite to company template
      const url = request.nextUrl.clone();
      url.pathname = `/t/moderntrust/${companySlug}`;
      
      return NextResponse.rewrite(url);
    }
  } catch (error) {
    console.error('Middleware error:', error);
  }

  // No custom domain found, continue normally
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logos|stock|api).*)',
  ],
};