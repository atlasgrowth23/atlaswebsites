import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { ThemeProvider } from '../components/tenant/ThemeProvider';

export default function DevLogin() {
  const router = useRouter();

  useEffect(() => {
    // In development, auto-login and redirect
    // In production, this would handle real authentication
    const handleDevLogin = async () => {
      // Set a dev cookie/token here if needed
      localStorage.setItem('atlas-dev-mode', 'true');
      
      // Redirect to contacts
      await router.push('/contacts');
    };

    handleDevLogin();
  }, [router]);

  return (
    <ThemeProvider>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Atlas - Dev Mode
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Redirecting to tenant dashboard...
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}