import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/login?error=auth_failed');
          return;
        }

        if (data.session) {
          // Check if this is an admin user (nicholas@atlasgrowth.ai or jared@atlasgrowth.ai)
          const email = data.session.user.email;
          const isAdmin = email === 'nicholas@atlasgrowth.ai' || email === 'jared@atlasgrowth.ai';
          
          if (isAdmin) {
            // Store Google tokens for API access
            const tokens = data.session.provider_token && data.session.provider_refresh_token ? {
              access_token: data.session.provider_token,
              refresh_token: data.session.provider_refresh_token,
              user_id: data.session.user.id,
              expires_at: Date.now() + (3600 * 1000) // 1 hour
            } : null;

            if (tokens) {
              // Store tokens for Google API access
              await fetch('/api/admin/google-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tokens)
              });
            }

            // Set role in user metadata
            const role = email === 'nicholas@atlasgrowth.ai' ? 'super_admin' : 'admin';
            
            // Store admin session info
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('atlas_admin', JSON.stringify({
                email: email,
                name: data.session.user.user_metadata?.full_name || email.split('@')[0],
                role: role,
                authenticated: true,
                login_time: Date.now()
              }));
            }

            // Redirect to admin dashboard
            router.push('/admin/messages');
            return;
          }
          
          // Regular user flow (existing company login)
          const loginSlug = typeof window !== 'undefined' ? sessionStorage.getItem('atlas_login_slug') : null;
          
          if (loginSlug) {
            // Find company by slug
            const companyResponse = await fetch(`/api/auth/lookup-company?slug=${encodeURIComponent(loginSlug)}`);
            
            if (companyResponse.ok) {
              const companyData = await companyResponse.json();
              
              if (companyData.company) {
                // Create user record
                const googleName = data.session.user.user_metadata?.full_name || data.session.user.user_metadata?.name || 'Business Owner';
                
                const createUserResponse = await fetch('/api/auth/create-user-by-company', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email: data.session.user.email,
                    name: googleName,
                    provider: 'google',
                    provider_id: data.session.user.id,
                    avatar_url: data.session.user.user_metadata?.avatar_url,
                    company_id: companyData.company.id
                  })
                });

                if (createUserResponse.ok) {
                  // Store user info
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('atlas_user', JSON.stringify({
                      email: data.session.user.email,
                      name: googleName,
                      provider: 'google',
                      provider_id: data.session.user.id,
                      avatar_url: data.session.user.user_metadata?.avatar_url,
                      company_id: companyData.company.id,
                      company_name: companyData.company.name,
                      company_slug: companyData.company.slug,
                      authenticated: true,
                      login_time: Date.now()
                    }));
                    
                    sessionStorage.removeItem('atlas_login_slug');
                  }

                  router.push('/dashboard');
                  return;
                }
              }
            }
          }
          
          router.push('/login?error=company_not_found');
        } else {
          router.push('/login?error=no_user');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.push('/login?error=callback_failed');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Completing sign in...</h2>
        <p className="text-gray-600">Please wait while we set up your account.</p>
      </div>
    </div>
  );
}