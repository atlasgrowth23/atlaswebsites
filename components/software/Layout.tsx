import React, { ReactNode } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const router = useRouter();
  const pathname = router.pathname;
  
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('businessSlug');
    router.push('/software/login');
  };
  
  const getCompanyName = () => {
    const businessSlug = typeof window !== 'undefined' ? localStorage.getItem('businessSlug') : null;
    
    if (!businessSlug) return 'HVAC Portal';
    
    return businessSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  const isActive = (path: string) => {
    return pathname.startsWith(path) ? 'border-b-2 border-blue-500 font-medium text-blue-600' : 'text-gray-500 hover:text-gray-700';
  };

  return (
    <>
      <Head>
        <title>{title} | HVAC Portal</title>
      </Head>
      
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-blue-600 text-white p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">{getCompanyName()} Portal</h1>
            <button 
              onClick={handleLogout}
              className="px-3 py-1 bg-blue-700 hover:bg-blue-800 rounded"
            >
              Logout
            </button>
          </div>
        </header>
        
        {/* Navigation */}
        <div className="bg-white shadow-sm">
          <div className="container mx-auto">
            <nav className="flex overflow-x-auto">
              <Link href="/software/dashboard" legacyBehavior>
                <a className={`px-4 py-3 whitespace-nowrap ${isActive('/software/dashboard')}`}>
                  Dashboard
                </a>
              </Link>
              <Link href="/software/messages" legacyBehavior>
                <a className={`px-4 py-3 whitespace-nowrap ${isActive('/software/messages')}`}>
                  Messages
                </a>
              </Link>
              <Link href="/software/contacts" legacyBehavior>
                <a className={`px-4 py-3 whitespace-nowrap ${isActive('/software/contacts')}`}>
                  Contacts
                </a>
              </Link>
              <Link href="/software/schedule" legacyBehavior>
                <a className={`px-4 py-3 whitespace-nowrap ${isActive('/software/schedule')}`}>
                  Schedule
                </a>
              </Link>
              <Link href="/software/settings" legacyBehavior>
                <a className={`px-4 py-3 whitespace-nowrap ${isActive('/software/settings')}`}>
                  Settings
                </a>
              </Link>
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
            &copy; {new Date().getFullYear()} HVAC Portal
          </div>
        </footer>
      </div>
    </>
  );
};

export default Layout;