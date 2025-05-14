import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if logged in from localStorage
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const businessSlug = localStorage.getItem('businessSlug');
    
    if (isLoggedIn && businessSlug) {
      setIsAuthenticated(true);
    } else {
      // Not authenticated, redirect to login
      router.push('/software/login');
    }
    
    setIsLoading(false);
  }, [router]);

  // Show loading indicator while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Render children only if authenticated
  return isAuthenticated ? <>{children}</> : null;
};

export default ProtectedRoute;