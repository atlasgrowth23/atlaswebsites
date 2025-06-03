import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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