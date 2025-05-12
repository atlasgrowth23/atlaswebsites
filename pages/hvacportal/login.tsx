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
    if (business && typeof business === 'string') {
      setBusinessSlug(business);
    }

    // Check if the user is already logged in
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
        <title>Login | HVAC Portal</title>
        <meta name="description" content="Login to your HVAC Portal" />
      </Head>

      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">
              HVAC Portal {businessSlug && `| ${businessSlug}`}
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
                    placeholder="••••••••"
                    required
                  />
                </div>
                
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Signing in...' : 'Sign In'}
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