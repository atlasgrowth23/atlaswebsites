import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Login() {
  const router = useRouter();
  const [businessSlug, setBusinessSlug] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Always reset login status - force login every time
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('businessSlug');
    
    // Get business from query parameter
    const businessParam = router.query.business;
    
    if (businessParam && typeof businessParam === 'string') {
      setBusinessSlug(businessParam);
      
      // Format the business name from the slug for display
      const formattedName = businessParam
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      setBusinessName(formattedName);
      
      // Auto-populate the username based on the slug
      setUsername(businessParam);
    }
  }, [router.query]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!businessSlug) {
      setError('Business not specified. Please use a valid login link.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password,
          businessSlug: businessSlug
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Store login state in localStorage
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('businessSlug', businessSlug);
        
        // Redirect to dashboard
        router.push('/hvacportal/dashboard');
      } else {
        // Show error message from API
        setError(data.message || 'Login failed. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setError('Unable to access the portal. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>
          {businessName ? `${businessName} Portal Login` : 'HVAC Portal Login'}
        </title>
      </Head>

      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">
              {businessName ? `${businessName} Portal` : 'HVAC Portal Login'}
            </h1>
            
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
              
              {businessSlug && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                  <p className="text-blue-700 text-sm mb-2">
                    <strong>Login for {businessName}</strong>
                  </p>
                  <p className="text-blue-700 text-sm">
                    Credentials loaded. Click "Sign In" to access your portal.
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username">Business ID</Label>
                <Input 
                  id="username"
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter business ID"
                  required
                  readOnly={!!businessSlug}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password"
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
              
              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Signing in...' : 'Sign In to Portal'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}