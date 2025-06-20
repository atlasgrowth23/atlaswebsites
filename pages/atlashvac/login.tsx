import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getCompanyBySlug } from '@/lib/supabase-db';

export default function AtlasHVACLogin() {
  const router = useRouter();
  const [companySlug, setCompanySlug] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoLogin, setAutoLogin] = useState(false);
  const [company, setCompany] = useState<any>(null);

  // Check for auto-login parameters
  useEffect(() => {
    if (router.isReady) {
      const { company: companyParam, auto } = router.query;
      if (companyParam && auto === 'true') {
        setCompanySlug(companyParam as string);
        setPassword('hvac2024');
        setAutoLogin(true);
        validateCompany(companyParam as string);
      }
    }
  }, [router.isReady, router.query]);

  const validateCompany = async (slug: string) => {
    try {
      const companyData = await getCompanyBySlug(slug.toLowerCase().trim());
      if (companyData) {
        setCompany(companyData);
        setError(null);
      } else {
        setError('Company not found');
      }
    } catch (err) {
      console.error('Error validating company:', err);
      setError('Failed to validate company');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Simple universal password check
      if (password !== 'hvac2024') {
        setError('Invalid password');
        setLoading(false);
        return;
      }

      // Validate company exists
      const company = await getCompanyBySlug(companySlug.toLowerCase().trim());
      if (!company) {
        setError('Company not found');
        setLoading(false);
        return;
      }

      // Set session cookie
      document.cookie = `atlashvac_session=${company.id}:${company.slug}; path=/atlashvac; max-age=86400; secure; samesite=lax`;
      
      // Redirect to contacts page
      router.push(`/atlashvac/${company.slug}/contacts`);
      
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {autoLogin && company ? `Welcome to ${company.name}` : 'Atlas HVAC Portal'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {autoLogin && company 
              ? 'Ready to access your customer management system' 
              : 'Enter your company details to access your customer management system'
            }
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {autoLogin && company ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">{company.name}</h3>
                    <p className="text-sm text-blue-700">Customer Management System</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="company-slug" className="block text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <input
                  id="company-slug"
                  name="company-slug"
                  type="text"
                  required
                  value={companySlug}
                  onChange={(e) => setCompanySlug(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="e.g., ready-heating-and-air-llc"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use your company slug (lowercase, with dashes)
                </p>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Access Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter password"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {error}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || (autoLogin && !company)}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
                </svg>
              )}
              {loading 
                ? 'Accessing...' 
                : autoLogin && company 
                  ? `Access ${company.name} Portal`
                  : 'Access Portal'
              }
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Need help? Contact your Atlas Growth representative
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}