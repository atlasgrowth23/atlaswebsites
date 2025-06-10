import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host');
  const pathname = request.nextUrl.pathname;
  
  // Admin route protection with simple auth
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/simple-login')) {
    const adminToken = request.cookies.get('admin-token')?.value;
    const adminSession = request.cookies.get('admin-session')?.value;
    
    if (!adminToken || !adminSession || adminSession !== 'authenticated') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/simple-login';
      return NextResponse.redirect(url);
    }
  }
  
  // Skip custom domain handling for main domain
  if (!hostname || 
      hostname.includes('localhost') ||
      hostname.includes('vercel.app') ||
      hostname === 'atlasgrowth.ai') {
    return NextResponse.next();
  }

  try {
    // Only do custom domain lookup if we have the required env vars
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: company } = await supabase
        .from('companies')
        .select('slug, template_key')  
        .eq('custom_domain', hostname)
        .single();

      if (company && company.slug && company.template_key) {
        const url = request.nextUrl.clone();
        url.pathname = `/t/${company.template_key}/${company.slug}`;
        return NextResponse.rewrite(url);
      }
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