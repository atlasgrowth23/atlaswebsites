import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function AdminV2Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to pipeline by default
    router.push('/admin-v2/pipeline');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}