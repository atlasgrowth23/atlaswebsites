import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';

export default function AdminCallback() {
  const router = useRouter();

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth callback error:', error);
        router.push('/admin/login?error=auth_failed');
        return;
      }

      if (session?.user?.email) {
        const email = session.user.email;
        
        // Check if this is an authorized admin
        if (email === 'nicholas@atlasgrowth.ai' || email === 'jaredthompson@atlasgrowth.ai') {
          
          // Set role in user metadata
          const role = email === 'nicholas@atlasgrowth.ai' ? 'super_admin' : 'admin';
          
          // Store admin tokens for Google API access if available
          if (session.provider_token && session.provider_refresh_token) {
            try {
              await fetch('/api/admin/google-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  user_id: session.user.id,
                  access_token: session.provider_token,
                  refresh_token: session.provider_refresh_token,
                  expires_at: Date.now() + (3600 * 1000) // 1 hour
                })
              });
            } catch (tokenError) {
              console.error('Error storing tokens:', tokenError);
              // Continue anyway - basic admin access still works
            }
          }

          // Redirect to admin dashboard
          router.push('/admin/pipeline');
        } else {
          // Not an authorized admin
          await supabase.auth.signOut();
          router.push('/admin/login?error=access_denied');
        }
      } else {
        router.push('/admin/login?error=no_user');
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      router.push('/admin/login?error=callback_failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-white mb-2">Setting up admin access...</h2>
        <p className="text-blue-200">Please wait while we verify your permissions.</p>
      </div>
    </div>
  );
}