import React, { useEffect, useState } from 'react';
import PortalLayout from '@/components/portal/PortalLayout';
import { useRouter } from 'next/router';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [businessSlug, setBusinessSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      try {
        // Check if user is logged in using localStorage
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        
        if (!isLoggedIn) {
          router.push('/hvacportal/login');
          return;
        }
        
        // Get businessSlug and username from localStorage
        const storedBusinessSlug = localStorage.getItem('businessSlug');
        const storedUsername = localStorage.getItem('username');
        
        setBusinessSlug(storedBusinessSlug);
        setUsername(storedUsername);
        
        // Format business name for display from slug
        if (storedBusinessSlug) {
          const formattedName = storedBusinessSlug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          setBusinessName(formattedName);
        }
        
        // In a production app, you would make an API call here to get 
        // the latest business data from the database
        
      } catch (err: any) {
        console.error('Error checking auth:', err);
        setError('Failed to load your business information');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);
  
  if (isLoading) {
    return (
      <PortalLayout>
        <div className="flex justify-center items-center h-64">
          <p>Loading your dashboard...</p>
        </div>
      </PortalLayout>
    );
  }

  // Convert businessSlug from string|null to string|undefined for prop type compatibility
  const businessSlugProp = businessSlug === null ? undefined : businessSlug;
  
  return (
    <PortalLayout businessSlug={businessSlugProp}>
      <h1 className="text-2xl font-bold mb-6">
        {businessName ? `${businessName} Dashboard` : 'Dashboard'}
      </h1>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-2">Business Information</h3>
            <p className="text-gray-600">
              {businessName ? `Logged in as ${businessName}` : 'No business associated with this account'}
            </p>
            <p className="text-gray-600 mt-2">
              Username: {username}
            </p>
            <p className="text-gray-600 mt-2">
              Business ID: {businessSlug}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-2">Customer Messages</h3>
            {businessSlug ? (
              <div className="space-y-4">
                <p className="text-gray-600">View and respond to customer inquiries</p>
                <Link 
                  href={`/hvacportal/messages?slug=${businessSlug}`}
                  className="text-blue-600 hover:underline block"
                >
                  Check Messages
                </Link>
              </div>
            ) : (
              <p className="text-gray-600">No business associated to check messages</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-2">Quick Actions</h3>
            <div className="space-y-2">
              {businessSlug && (
                <>
                  <Link 
                    href={`/t/moderntrust/${businessSlug}`} 
                    className="text-blue-600 hover:underline block"
                    target="_blank"
                  >
                    View ModernTrust Template
                  </Link>
                  <Link 
                    href={`/t/boldenergy/${businessSlug}`} 
                    className="text-blue-600 hover:underline block"
                    target="_blank"
                  >
                    View BoldEnergy Template
                  </Link>
                </>
              )}
              <Link 
                href="/hvacportal/settings" 
                className="text-blue-600 hover:underline block"
              >
                Update Business Info
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}