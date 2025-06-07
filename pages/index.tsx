import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user has auth token
    const authToken = localStorage.getItem('auth_token');
    if (authToken) {
      // Redirect to admin dashboard if authenticated
      router.replace('/admin/pipeline');
    } else {
      // Redirect to login if not authenticated
      router.replace('/admin/login');
    }
  }, [router]);

  return (
    <>
      <Head>
        <title>HVAC Lead Management Platform</title>
        <meta name="description" content="Comprehensive platform for HVAC contractors to manage their business website, customer contacts, and messaging." />
      </Head>
      
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
              HVAC Lead Management
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Redirecting to dashboard...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    </>
  );
}