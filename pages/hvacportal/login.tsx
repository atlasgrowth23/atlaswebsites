import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Login() {
  const router = useRouter();
  const [businessSlug, setBusinessSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [defaultCredentialsLoaded, setDefaultCredentialsLoaded] = useState(false);

  useEffect(() => {
    // Get business from query parameter - check both "slug" and "business" parameters
    const slugParam = router.query.slug;
    const businessParam = router.query.business;
    
    // Use either slug or business parameter
    const businessSlugValue = businessParam || slugParam;
    
    // Check if we have a business slug in the query
    const hasBusinessParam = businessSlugValue && typeof businessSlugValue === 'string';
    
    if (hasBusinessParam) {
      setBusinessSlug(businessSlugValue);
      
      // Fetch default credentials for this business slug
      fetchDefaultCredentials(businessSlugValue);
    } else {
      // If no business slug, just show the form
      setIsLoading(false);
    }

    // Check if the user is already logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const storedBusinessSlug = localStorage.getItem('businessSlug');
    
    // If logged in and we're not trying to log into a different business,
    // redirect to dashboard
    if (isLoggedIn && (!hasBusinessParam || storedBusinessSlug === businessSlugValue)) {
      router.push('/hvacportal/dashboard');
    }
  }, [router.query]);

  // Fetch default credentials for a business
  const fetchDefaultCredentials = async (slug: string) => {
    console.log('Fetching credentials for:', slug);
    try {
      const url = `/api/default-credentials?slug=${slug}`;
      console.log('Fetching from URL:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Credentials response:', data);
      
      if (data.success) {
        // Pre-populate both username and password
        console.log('Setting username to:', data.username);
        console.log('Setting password to:', data.password);
        setUsername(data.username || '');
        setPassword(data.password || '');
        setDefaultCredentialsLoaded(true);
      } else {
        console.log('Failed to load credentials:', data.message);
      }
    } catch (err) {
      console.error('Error fetching default credentials:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError(null);
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          businessSlug
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setError(data.message || 'Invalid credentials');
      } else {
        // Store login state in localStorage
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('businessSlug', data.businessSlug);
        localStorage.setItem('username', data.username);
        
        // Redirect to dashboard
        router.push('/hvacportal/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in');
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
                
                {businessSlug && (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                    <p className="text-blue-700 text-sm mb-2">
                      <strong>Auto-Login for {businessSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</strong>
                    </p>
                    <p className="text-blue-700 text-sm">
                      {defaultCredentialsLoaded ? 
                        `Username and password have been auto-filled. Just click "Sign In" to continue.` : 
                        `Loading login credentials... If not loaded, try refreshing the page.`
                      }
                    </p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username"
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="your username"
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
                      Default password format: hvac#### (where #### is a 4-digit number)
                    </p>
                  )}
                </div>
                
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Signing in...' : businessSlug ? `Sign In to ${businessSlug} Portal` : 'Sign In'}
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