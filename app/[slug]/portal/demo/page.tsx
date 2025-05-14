'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DemoPage({ params }: { params: { slug: string } }) {
  const router = useRouter();

  useEffect(() => {
    // Function to handle auto-login
    async function autoLogin() {
      try {
        // Call the demo auth endpoint
        const response = await fetch(`/api/auth/demo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ companySlug: params.slug }),
        });

        if (response.ok) {
          // If successful, redirect to portal
          router.push(`/${params.slug}/portal/messages`);
        } else {
          console.error('Demo login failed');
        }
      } catch (error) {
        console.error('Error during demo login:', error);
      }
    }

    // Run the auto-login
    autoLogin();
  }, [params.slug, router]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="mb-4">
          <svg className="animate-spin h-10 w-10 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
          Logging into Demo Portal...
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          You'll be redirected to the HVAC portal momentarily.
        </p>
      </div>
    </div>
  );
}