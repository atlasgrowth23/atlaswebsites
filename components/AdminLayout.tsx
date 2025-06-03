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
  currentPage: 'dashboard' | 'pipeline';
}

export default function AdminLayout({ children, currentPage }: AdminLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-900">HVAC Lead Management</h1>
              
              {/* Navigation Tabs */}
              <div className="flex space-x-4">
                <Link 
                  href="/admin/dashboard"
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === 'dashboard'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  📊 Dashboard
                </Link>
                <Link 
                  href="/admin/pipeline"
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === 'pipeline'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  🔄 Pipeline
                </Link>
              </div>
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <div className="text-gray-900 font-medium">{user.name}</div>
                <div className="text-gray-500">
                  {user.role === 'admin' ? 'Admin' : 'Viewer'} • {user.states.join(', ')}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-8">
        {children}
      </main>
    </div>
  );
}

export { type User };