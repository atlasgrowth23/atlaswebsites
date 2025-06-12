import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host');
  const pathname = request.nextUrl.pathname;
  
  // Admin route protection with Google OAuth only
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login') && !pathname.startsWith('/admin/callback')) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Try multiple cookie names for Supabase session
      const authToken = request.cookies.get('sb-access-token')?.value || 
                       request.cookies.get('supabase-auth-token')?.value ||
                       request.cookies.get('sb-access-token')?.value ||
                       request.cookies.get('supabase.auth.token')?.value;
      
      let user = null;
      
      if (authToken) {
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser(authToken);
          user = authUser;
        } catch (error) {
          console.error('Auth token validation failed:', error);
        }
      }
      
      if (!user?.email) {
        // Log for debugging
        console.log('Middleware: No user found, cookies:', Object.fromEntries(request.cookies.entries()));
        const url = request.nextUrl.clone();
        url.pathname = '/admin/login';
        return NextResponse.redirect(url);
      }
      
      console.log('Middleware: User found:', user.email);

      // Check against admin_users table instead of hardcoded emails
      const serviceSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { data: adminUser } = await serviceSupabase
        .from('admin_users')
        .select('role, is_active')
        .eq('email', user.email)
        .eq('is_active', true)
        .single();
      
      if (!adminUser) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/login';
        return NextResponse.redirect(url);
      }
    } catch (error) {
      console.error('Admin auth error:', error);
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