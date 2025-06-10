import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host');
  const pathname = request.nextUrl.pathname;
  
  // Admin route protection
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login') && !pathname.startsWith('/admin/callback')) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Get session from request cookies
      const authHeader = request.headers.get('authorization');
      const sessionCookie = request.cookies.get('sb-access-token')?.value;
      
      if (!authHeader && !sessionCookie) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/login';
        return NextResponse.redirect(url);
      }

      // Try to verify the session
      if (sessionCookie) {
        const { data: { user }, error } = await supabase.auth.getUser(sessionCookie);
        
        if (error || !user?.email) {
          const url = request.nextUrl.clone();
          url.pathname = '/admin/login';
          return NextResponse.redirect(url);
        }
        
        // Check if user is authorized admin
        const email = user.email;
        if (email !== 'nicholas@atlasgrowth.ai' && email !== 'jaredthompson@atlasgrowth.ai') {
          const url = request.nextUrl.clone();
          url.pathname = '/admin/login';
          url.searchParams.set('error', 'access_denied');
          return NextResponse.redirect(url);
        }
      }
    } catch (error) {
      console.error('Admin auth middleware error:', error);
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
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
    // Direct Supabase lookup - no Edge Config bullshit
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