import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import jwt from 'jsonwebtoken';

interface User {
  email: string;
  role: 'admin' | 'viewer';
  states: string[];
  name: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage: 'pipeline' | 'sessions' | 'templates' | 'invoices';
}

export default function AdminLayout({ children, currentPage }: AdminLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      router.push('/admin/login');
      return;
    }

    try {
      // Decode JWT token to get user info
      const decoded = jwt.decode(token) as any;
      if (!decoded || decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem('auth_token');
        router.push('/admin/login');
        return;
      }

      setUser({
        email: decoded.email,
        role: decoded.role,
        states: decoded.states,
        name: decoded.name
      });
    } catch (error) {
      localStorage.removeItem('auth_token');
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile menu overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black opacity-50"></div>
        </div>
      )}

      {/* Left Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        {/* Logo/Title */}
        <div className="px-6 py-5 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Lead Management</h1>
          <p className="text-sm text-gray-500 mt-1">{user.states.join(', ')}</p>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4">
          <div className="space-y-1">
            <Link 
              href="/admin/pipeline"
              className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-md ${
                currentPage === 'pipeline' 
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2H9m0 0v-6a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2H9" />
              </svg>
              Pipeline
            </Link>
            
            <Link 
              href="/admin/sessions"
              className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-md ${
                currentPage === 'sessions' 
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Sessions
            </Link>

            <Link 
              href="/admin/invoices"
              className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-md ${
                currentPage === 'invoices' 
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Invoices
            </Link>

          </div>
        </nav>

        {/* User Info & Logout */}
        <div className="px-3 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">
                {user.role === 'admin' ? 'Administrator' : 'Viewer'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-3 inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              title="Sign out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-gray-50 lg:ml-0">
        {/* Mobile header */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Lead Management</h1>
          <button
            onClick={handleLogout}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export { type User };