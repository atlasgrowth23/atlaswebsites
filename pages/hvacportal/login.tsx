import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Login() {
  const router = useRouter();
  const [businessSlug, setBusinessSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create client only on client-side to avoid SSR issues
  const supabase = typeof window !== 'undefined' ? createClient() : null;

  useEffect(() => {
    if (!supabase) return;
    
    // Get business from query parameter
    const { business } = router.query;
    
    // Important: We need to stop the auto-redirect behavior when the user 
    // comes with a business parameter, as they need to complete the login manually
    const hasBusinessParam = business && typeof business === 'string';
    
    if (hasBusinessParam) {
      setBusinessSlug(business);
      
      // Pre-populate email based on business slug
      // Format: business-slug@yourcompany.com 
      // (You should update this to match your actual email format)
      setEmail(`${business}@hvacportal.com`);
      
      // Just show the form right away without checking session when business param exists
      setIsLoading(false);
      return; // Skip the session check when we have a business param
    }

    // Check if the user is already logged in
    // ONLY do this when there's no business parameter
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          router.push('/hvacportal/dashboard');
        }
      } catch (error) {
        console.error('Auth session check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [router, supabase]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    setError(null);
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        setError(error.message);
      } else {
        router.push('/hvacportal/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async () => {
    if (!supabase) return;
    
    setError(null);
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/hvacportal/dashboard`
        }
      });
      
      if (error) {
        setError(error.message);
      } else {
        setError('Check your email for the confirmation link');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign up');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>
          {businessSlug 
            ? `${businessSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} | HVAC Portal Login` 
            : `Login | HVAC Portal`}
        </title>
        <meta 
          name="description" 
          content={businessSlug 
            ? `Login to ${businessSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} HVAC business dashboard` 
            : `Login to your HVAC Portal`} 
        />
      </Head>

      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">
              {businessSlug 
                ? `${businessSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Portal` 
                : `HVAC Portal Login`}
            </h1>
            
            {isLoading ? (
              <div className="flex justify-center p-4">
                <p>Loading...</p>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password"
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={businessSlug ? "Enter your business password" : "••••••••"}
                    required
                  />
                  {businessSlug && (
                    <p className="text-xs text-gray-500 mt-1">
                      Contact support if you need your default password
                    </p>
                  )}
                </div>
                
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Signing in...' : businessSlug ? `Sign In to ${businessSlug} Portal` : 'Sign In'}
                  </Button>
                  
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full"
                    onClick={handleSignUp}
                    disabled={isSubmitting}
                  >
                    Create Account
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}