import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { queryMany } from '@/lib/db';

export default function DashboardPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchFirstCompany() {
      try {
        // In a real implementation, this would:
        // 1. Check if the user is authenticated
        // 2. Get the company associated with the user
        // 3. Redirect to that company's dashboard
        
        // For now, we're just redirecting to the first company in our demo
        // Replace this with real authentication logic later
        
        // Demo fallback - replace with real data
        const demoCompany = "vandys-heating-air-conditioning-llc";
        router.push(`/dashboard/${demoCompany}`);
      } catch (err) {
        console.error('Error fetching company:', err);
        setError('Unable to find your company. Please try again later.');
      }
    }
    
    fetchFirstCompany();
  }, [router]);
  
  return (
    <div className="flex flex-col justify-center items-center h-screen">
      {error ? (
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
        </div>
      ) : (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      )}
    </div>
  );
}