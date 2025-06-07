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

        if (data.session?.user?.email) {
          // Get the slug that was stored during login
          const loginSlug = typeof window !== 'undefined' ? sessionStorage.getItem('atlas_login_slug') : null;
          
          if (loginSlug) {
            // Find company by slug instead of email
            const companyResponse = await fetch(`/api/auth/lookup-company?slug=${encodeURIComponent(loginSlug)}`);
            
            if (companyResponse.ok) {
              const companyData = await companyResponse.json();
              
              if (companyData.company) {
                // Create NEW user record using Google data only
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
                  // Store user info with company data in sessionStorage as backup
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('atlas_user', JSON.stringify({
                      email: data.session.user.email,
                      name: data.session.user.user_metadata?.full_name || data.session.user.user_metadata?.name,
                      provider: 'google',
                      provider_id: data.session.user.id,
                      avatar_url: data.session.user.user_metadata?.avatar_url,
                      company_id: companyData.company.id,
                      company_name: companyData.company.name,
                      company_slug: companyData.company.slug,
                      authenticated: true,
                      login_time: Date.now()
                    }));
                    
                    // Clean up the stored slug
                    sessionStorage.removeItem('atlas_login_slug');
                  }

                  // Redirect to dashboard
                  router.push('/dashboard');
                  return;
                } else {
                  console.error('Failed to create user record');
                  router.push('/login?error=user_creation_failed');
                  return;
                }
              }
            }
          }
          
          // If no slug or company not found, redirect with error
          console.error('No company found for slug:', loginSlug);
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