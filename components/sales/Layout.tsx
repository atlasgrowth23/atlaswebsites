import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface LayoutProps {
  children: React.ReactNode;
  currentUser?: any;
}

export default function SalesLayout({ children, currentUser }: LayoutProps) {
  const router = useRouter();
  
  // Navigation items
  const navItems = [
    { label: 'Dashboard', path: '/sales' },
    { label: 'Leads', path: '/sales/leads' },
    { label: 'Appointments', path: '/sales/appointments' },
    { label: 'Reports', path: '/sales/reports' },
    { label: 'Settings', path: '/sales/settings' },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation bar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/sales" className="text-xl font-bold text-blue-600">
                  HVAC Sales Portal
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map(item => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      router.pathname === item.path || 
                      (item.path !== '/sales' && router.pathname.startsWith(item.path))
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              {currentUser && (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700">{currentUser.name}</span>
                  {currentUser.is_admin && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      Admin
                    </span>
                  )}
                  <Link
                    href="/"
                    className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Main Site
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile navigation */}
      <div className="sm:hidden py-2 bg-white shadow-sm border-t">
        <div className="grid grid-cols-5 gap-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              href={item.path}
              className={`text-center py-2 text-xs font-medium ${
                router.pathname === item.path || 
                (item.path !== '/sales' && router.pathname.startsWith(item.path))
                  ? 'text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}