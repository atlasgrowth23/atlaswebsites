import { useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function AdminIndex() {
  const router = useRouter();
  
  // Redirect to the dashboard
  useEffect(() => {
    router.push('/admin/dashboard');
  }, [router]);
  
  return (
    <>
      <Head>
        <title>Admin Portal</title>
      </Head>
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <h1>Redirecting to Dashboard...</h1>
        <p>If you are not redirected, <Link href="/admin/dashboard" style={{ color: '#1e3a8a', textDecoration: 'underline' }}>click here</Link>.</p>
      </div>
    </>
  );
}