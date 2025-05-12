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

  // Use useEffect to check if we're on the client side and if user is authenticated
  useEffect(() => {
    setIsClient(true);
    
    // Check if user is authenticated by looking for session cookie
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const currentBusinessSlug = localStorage.getItem('businessSlug');
      
      // If not logged in or businessSlug doesn't match the current one
      if (!isLoggedIn || (businessSlug && currentBusinessSlug !== businessSlug)) {
        // Redirect to login with the business slug if available
        if (businessSlug) {
          router.push(`/hvacportal/login?slug=${businessSlug}`);
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
            {businessSlug 
              ? `${businessSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Portal` 
              : 'HVAC Portal'}
          </h1>
          <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md">
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <Link href="/hvacportal/dashboard" className={`block p-2 rounded ${router.pathname === '/hvacportal/dashboard' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/hvacportal/messages" className={`block p-2 rounded ${router.pathname === '/hvacportal/messages' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}>
                  Messages
                </Link>
              </li>
              <li>
                <Link href="/hvacportal/settings" className={`block p-2 rounded ${router.pathname === '/hvacportal/settings' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}>
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