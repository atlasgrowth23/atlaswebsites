import React, { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface PortalLayoutProps {
  children: ReactNode;
  businessSlug?: string;
}

export default function PortalLayout({ children, businessSlug }: PortalLayoutProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isClient, setIsClient] = useState(false);

  // Use useEffect to check if we're on the client side
  useEffect(() => {
    setIsClient(true);
    
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data?.session) {
        router.push('/hvacportal/login');
      }
    };
    
    checkAuth();
  }, [router, supabase.auth]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/hvacportal/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // If not on client side yet, show minimal layout
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">
            HVAC Portal {businessSlug && `- ${businessSlug}`}
          </h1>
          <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md">
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <Link href="/hvacportal/dashboard" className={`block p-2 rounded ${router.pathname === '/hvacportal/dashboard' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/hvacportal/messages" className={`block p-2 rounded ${router.pathname === '/hvacportal/messages' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}>
                  Messages
                </Link>
              </li>
              <li>
                <Link href="/hvacportal/settings" className={`block p-2 rounded ${router.pathname === '/hvacportal/settings' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}>
                  Settings
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}