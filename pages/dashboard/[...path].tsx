import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function DashboardCatchAllRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.push('/');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-lg">Redirecting to homepage...</p>
      </div>
    </div>
  );
}