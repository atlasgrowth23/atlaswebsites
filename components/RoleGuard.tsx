import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole?: 'super_admin' | 'admin';
  redirectTo?: string;
}

export default function RoleGuard({ 
  children, 
  requiredRole = 'admin',
  redirectTo = '/admin/pipeline' 
}: RoleGuardProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.email) {
        router.push('/admin/login');
        return;
      }

      const email = session.user.email;
      const userRole = email === 'nicholas@atlasgrowth.ai' ? 'super_admin' : 'admin';
      
      setUser({ email, role: userRole });

      // Check if user has required role
      if (requiredRole === 'super_admin' && userRole !== 'super_admin') {
        // Access denied - redirect to allowed page
        router.push(redirectTo);
        return;
      }

      setHasAccess(true);
    } catch (error) {
      console.error('Role check error:', error);
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <button
            onClick={() => router.push(redirectTo)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Pipeline
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}