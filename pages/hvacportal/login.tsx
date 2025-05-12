import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/lib/supabase/client';

export default function Login() {
  const router = useRouter();
  const { business } = router.query;
  const [businessSlug, setBusinessSlug] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (business && typeof business === 'string') {
      setBusinessSlug(business);
    }

    // Check if the user is already logged in
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        router.push('/hvacportal/dashboard');
      }
    };

    checkSession();
  }, [business, router, supabase.auth]);

  return (
    <>
      <Head>
        <title>Login | HVAC Portal</title>
        <meta name="description" content="Login to your HVAC Portal" />
      </Head>

      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">
              HVAC Portal {businessSlug && `| ${businessSlug}`}
            </h1>
            
            <div className="mb-6">
              <Auth
                supabaseClient={supabase}
                appearance={{ theme: ThemeSupa }}
                theme="light"
                providers={[]}
                redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/hvacportal/dashboard`}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}