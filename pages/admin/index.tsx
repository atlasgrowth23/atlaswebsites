import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import { createClient } from '@/lib/supabase/client';

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();
  
  // Check auth on page load
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/admin/login');
      }
    };
    
    checkAuth();
  }, [router, supabase]);
  
  return (
    <AdminLayout>
      <Head>
        <title>Admin Dashboard | HVAC Sites</title>
      </Head>
      
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Total Companies</h2>
          <p className="text-3xl font-bold text-blue-600">27</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Active Leads</h2>
          <p className="text-3xl font-bold text-blue-600">14</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Pipeline Value</h2>
          <p className="text-3xl font-bold text-blue-600">$24,500</p>
        </div>
      </div>
    </AdminLayout>
  );
}
