import React from 'react';
import Link from 'next/link';

interface SimpleAdminLayoutProps {
  children: React.ReactNode;
}

export default function SimpleAdminLayout({ children }: SimpleAdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Atlas Growth Admin</h1>
            </div>
            <nav className="flex space-x-8">
              <Link
                href="/admin/pipeline"
                className="text-blue-600 hover:text-blue-800 px-3 py-2 rounded-md text-sm font-medium bg-blue-50"
              >
                Pipeline
              </Link>
              <button
                onClick={() => {
                  document.cookie = 'admin-token=; Max-Age=0; path=/';
                  document.cookie = 'admin-session=; Max-Age=0; path=/';
                  window.location.href = '/admin/simple-login';
                }}
                className="text-red-500 hover:text-red-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6">
        {children}
      </main>
    </div>
  );
}