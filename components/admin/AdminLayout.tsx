import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const supabase = createClient();
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">HVAC Admin</h1>
          <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
        </div>
      </header>
      
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md">
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <Link href="/admin" className={`block p-2 rounded ${router.pathname === '/admin' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/admin/leads" className={`block p-2 rounded ${router.pathname === '/admin/leads' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}>
                  Leads & CRM
                </Link>
              </li>
              <li>
                <Link href="/admin/pipeline" className={`block p-2 rounded ${router.pathname === '/admin/pipeline' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}>
                  Sales Pipeline
                </Link>
              </li>
              <li>
                <Link href="/" className="block p-2 rounded hover:bg-gray-100">
                  Back to Website
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
