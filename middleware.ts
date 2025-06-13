import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth-google';

export default async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host');
  const pathname = request.nextUrl.pathname;
  
  // Handle admin authentication
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const sessionToken = request.cookies.get('admin_session')?.value;
    
    console.log(`🔐 Auth check for ${pathname}: Token=${sessionToken ? 'present' : 'missing'}`);
    
    if (!sessionToken) {
      console.log('❌ No session token, redirecting to login');
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    
    try {
      const session = await getAdminSession(sessionToken);
      if (!session) {
        console.log('❌ Invalid session token, redirecting to login');
        const loginUrl = new URL('/admin/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
      
      console.log(`✅ Valid session for ${session.email} (${session.role})`);
      
      // Add user info to headers for the request
      const response = NextResponse.next();
      response.headers.set('x-admin-email', session.email);
      response.headers.set('x-admin-role', session.role);
      response.headers.set('x-admin-name', session.name || '');
      
      return response;
    } catch (error) {
      console.error('❌ Session validation error:', error);
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Skip custom domain handling for admin routes and main domain
  if (pathname.startsWith('/admin') || 
      pathname.startsWith('/api/auth') ||
      !hostname || 
      hostname.includes('localhost') ||
      hostname.includes('vercel.app') ||
      hostname === 'atlasgrowth.ai') {
    return NextResponse.next();
  }

  try {
    // Only do custom domain lookup if we have the required env vars
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createClient } = await import('@supabase/supabase-js');
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/((?!_next/static|_next/image|favicon.ico|logos|stock|api/auth).*)',
  ],
};