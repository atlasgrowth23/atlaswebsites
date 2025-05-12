import React, { useEffect, useState } from 'react';
import PortalLayout from '@/components/portal/PortalLayout';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/router';
import { Card, CardContent } from '@/components/ui/card';

export default function Dashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [userName, setUserName] = useState<string | null>(null);
  const [businessSlug, setBusinessSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/hvacportal/login');
          return;
        }
        
        // Set email if available, otherwise keep as null
        setUserName(user.email || null);
        
        // Email format should be business-slug@hvacportal.com
        // Extract business slug from email
        if (user.email) {
          const emailParts = user.email.split('@');
          if (emailParts.length === 2 && emailParts[1] === 'hvacportal.com') {
            setBusinessSlug(emailParts[0]);
          }
        }
        
        // In a real application, you would query user_profiles table
        // for additional business information using the user's ID
        
      } catch (err: any) {
        console.error('Error fetching user info:', err);
        setError('Failed to load your business information');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserInfo();
  }, [router, supabase]);
  
  if (isLoading) {
    return (
      <PortalLayout>
        <div className="flex justify-center items-center h-64">
          <p>Loading your dashboard...</p>
        </div>
      </PortalLayout>
    );
  }
  
  // Format the business name for display
  const formattedBusinessName = businessSlug ? 
    businessSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') :
    null;

  // Convert businessSlug from string|null to string|undefined for prop type compatibility
  const businessSlugProp = businessSlug === null ? undefined : businessSlug;
  
  return (
    <PortalLayout businessSlug={businessSlugProp}>
      <h1 className="text-2xl font-bold mb-6">
        {formattedBusinessName ? `${formattedBusinessName} Dashboard` : 'Dashboard'}
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
              {formattedBusinessName ? `Logged in as ${formattedBusinessName}` : 'No business associated with this account'}
            </p>
            <p className="text-gray-600 mt-2">
              Email: {userName}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-2">Recent Activity</h3>
            <p className="text-gray-600">No recent activity to display</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <button className="text-blue-600 hover:underline block">View Website</button>
              <button className="text-blue-600 hover:underline block">Check Messages</button>
              <button className="text-blue-600 hover:underline block">Update Business Info</button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}