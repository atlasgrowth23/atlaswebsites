import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';

async function getCompanySlugFromDB(hostname: string): Promise<string | null> {
  try {
    const baseUrl = process.env.VERCEL_URL?.startsWith('http') 
      ? process.env.VERCEL_URL 
      : `https://${process.env.VERCEL_URL || 'localhost:3000'}`;
    const response = await fetch(`${baseUrl}/api/get-company-by-domain?domain=${hostname}`, {
      headers: { 'User-Agent': 'middleware-fallback' }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.slug || null;
    }
  } catch (error) {
    console.error('DB fallback error:', error);
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host');
  
  // Skip internal domains
  if (!hostname || 
      hostname.includes('localhost') ||
      hostname.includes('vercel.app') ||
      hostname === 'atlasgrowth.ai') {
    return NextResponse.next();
  }

  let companySlug: string | null = null;

  try {
    // Try Edge Config first (super fast)
    const domainMap = await get('custom_domains') as Record<string, string> | null;
    
    if (domainMap && domainMap[hostname]) {
      companySlug = domainMap[hostname];
    }
  } catch (error) {
    console.error('Edge Config error:', error);
  }

  // Fallback to database if not found in Edge Config
  if (!companySlug) {
    companySlug = await getCompanySlugFromDB(hostname);
  }

  // If we found a company slug, rewrite to template
  if (companySlug) {
    const url = request.nextUrl.clone();
    url.pathname = `/t/moderntrust/${companySlug}`;
    return NextResponse.rewrite(url);
  }

  // No custom domain found, continue normally
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logos|stock|api).*)',
  ],
};