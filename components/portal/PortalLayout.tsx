import React, { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';

interface PortalLayoutProps {
  children: ReactNode;
  businessSlug?: string;
}

export default function PortalLayout({ children, businessSlug }: PortalLayoutProps) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Store the active business slug from localStorage
  const [activeBusinessSlug, setActiveBusinessSlug] = useState<string | null>(null);

  // Use useEffect to check if we're on the client side and if user is authenticated
  useEffect(() => {
    setIsClient(true);
    
    // Check if user is authenticated by looking for session data
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const storedBusinessSlug = localStorage.getItem('businessSlug');
      
      // Get business slug - prefer the one from props, fallback to localStorage
      const effectiveSlug = businessSlug || storedBusinessSlug;
      setActiveBusinessSlug(effectiveSlug);
      
      // If not logged in, redirect to login
      if (!isLoggedIn) {
        // Redirect to login with the business slug if available
        if (effectiveSlug) {
          router.push(`/hvacportal/login?business=${effectiveSlug}`);
        } else {
          router.push('/hvacportal/login');
        }
      } else {
        setIsAuthenticated(true);
      }
    };
    
    checkAuth();
  }, [router, businessSlug]);

  const handleSignOut = () => {
    // Clear authentication state
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('businessSlug');
    localStorage.removeItem('username');
    
    // Redirect to login
    router.push('/hvacportal/login');
  };

  // If not on client side yet or not authenticated, show minimal layout
  if (!isClient || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">
            {activeBusinessSlug 
              ? `${activeBusinessSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Portal` 
              : 'HVAC Portal'}
          </h1>
          <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md">
          <nav className="py-6">
            <div className="px-4 mb-2">
              <h3 className="text-xs uppercase font-semibold text-gray-500 tracking-wider">Core</h3>
            </div>
            <ul className="space-y-1">
              <li>
                <Link href="/hvacportal/dashboard" className={`flex items-center px-4 py-2 ${router.pathname === '/hvacportal/dashboard' ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-500' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/hvacportal/jobs" className={`flex items-center px-4 py-2 ${router.pathname === '/hvacportal/jobs' ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-500' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Jobs
                </Link>
              </li>
              <li>
                <Link href="/hvacportal/schedule" className={`flex items-center px-4 py-2 ${router.pathname === '/hvacportal/schedule' ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-500' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Schedule
                </Link>
              </li>
              <li>
                <Link href="/hvacportal/contacts" className={`flex items-center px-4 py-2 ${router.pathname === '/hvacportal/contacts' ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-500' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Contacts
                </Link>
              </li>
              <li>
                <Link href="/hvacportal/equipment" className={`flex items-center px-4 py-2 ${router.pathname === '/hvacportal/equipment' ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-500' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Equipment
                </Link>
              </li>
            </ul>
            
            <div className="px-4 mt-8 mb-2">
              <h3 className="text-xs uppercase font-semibold text-gray-500 tracking-wider">Communication</h3>
            </div>
            <ul className="space-y-1">
              <li>
                <Link href="/hvacportal/messages" className={`flex items-center px-4 py-2 ${router.pathname === '/hvacportal/messages' ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-500' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Messages
                </Link>
              </li>
              <li>
                <Link href="/hvacportal/invoices" className={`flex items-center px-4 py-2 ${router.pathname === '/hvacportal/invoices' ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-500' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Invoices
                </Link>
              </li>
            </ul>
            
            <div className="px-4 mt-8 mb-2">
              <h3 className="text-xs uppercase font-semibold text-gray-500 tracking-wider">Admin</h3>
            </div>
            <ul className="space-y-1">
              <li>
                <Link href="/hvacportal/reports" className={`flex items-center px-4 py-2 ${router.pathname === '/hvacportal/reports' ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-500' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Reports
                </Link>
              </li>
              <li>
                <Link href="/hvacportal/settings" className={`flex items-center px-4 py-2 ${router.pathname === '/hvacportal/settings' ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-500' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}