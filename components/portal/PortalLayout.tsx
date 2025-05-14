import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface PortalLayoutProps {
  children: ReactNode;
  title: string;
  activeTab: string;
}

export default function PortalLayout({ children, title, activeTab }: PortalLayoutProps) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [businessSlug, setBusinessSlug] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check login status from localStorage
    const storedLoginStatus = localStorage.getItem('isLoggedIn');
    const storedBusinessSlug = localStorage.getItem('businessSlug');
    
    if (storedLoginStatus === 'true' && storedBusinessSlug) {
      setIsLoggedIn(true);
      setBusinessSlug(storedBusinessSlug);
      
      // Format business name for display
      const formattedName = storedBusinessSlug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      setBusinessName(formattedName);
      setIsLoading(false);
    } else {
      // Not logged in, redirect to login page
      router.push('/portal/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('businessSlug');
    router.push('/portal/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{title} - {businessName} Portal</title>
      </Head>
      
      <div className="flex flex-col min-h-screen">
        {/* Header/Navigation */}
        <header className="bg-blue-600 text-white p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">{businessName} Portal</h1>
            <button 
              onClick={handleLogout}
              className="px-3 py-1 bg-blue-700 hover:bg-blue-800 rounded"
            >
              Logout
            </button>
          </div>
        </header>
        
        {/* Tabs Navigation */}
        <div className="bg-white shadow-sm">
          <div className="container mx-auto">
            <nav className="flex overflow-x-auto">
              <a 
                href="/portal/dashboard" 
                className={`px-4 py-3 whitespace-nowrap ${activeTab === 'dashboard' 
                  ? 'border-b-2 border-blue-500 font-medium text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'}`}
              >
                Dashboard
              </a>
              <a 
                href="/portal/messages" 
                className={`px-4 py-3 whitespace-nowrap ${activeTab === 'messages' 
                  ? 'border-b-2 border-blue-500 font-medium text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'}`}
              >
                Messages
              </a>
              <a 
                href="/portal/contacts" 
                className={`px-4 py-3 whitespace-nowrap ${activeTab === 'contacts' 
                  ? 'border-b-2 border-blue-500 font-medium text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'}`}
              >
                Contacts
              </a>
              <a 
                href="/portal/schedule" 
                className={`px-4 py-3 whitespace-nowrap ${activeTab === 'schedule' 
                  ? 'border-b-2 border-blue-500 font-medium text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'}`}
              >
                Schedule
              </a>
              <a 
                href="/portal/settings" 
                className={`px-4 py-3 whitespace-nowrap ${activeTab === 'settings' 
                  ? 'border-b-2 border-blue-500 font-medium text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'}`}
              >
                Settings
              </a>
            </nav>
          </div>
        </div>
        
        {/* Main Content */}
        <main className="flex-grow bg-gray-50 p-6">
          <div className="container mx-auto">
            {children}
          </div>
        </main>
        
        {/* Footer */}
        <footer className="bg-gray-100 p-4 border-t">
          <div className="container mx-auto text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} HVAC Portal - All rights reserved
          </div>
        </footer>
      </div>
    </>
  );
}