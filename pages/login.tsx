// pages/login.tsx
import { GetServerSideProps } from "next";
import Head from "next/head";
import { portalDb } from "../lib/portalDb";
import { useState, useEffect } from "react";

interface Props {
  slug: string;
  username: string;
  companyName: string;
  password: string;
}

export default function LoginPage({ slug, username, companyName, password }: Props) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState("");
  
  // Auto-login when page loads - simpler version
  useEffect(() => {
    const autoLogin = async () => {
      if (!isLoggingIn) {
        setIsLoggingIn(true);
        
        try {
          // For preview accounts, we just need to send the slug
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ slug }),
          });
          
          if (response.redirected) {
            // If successful login, follow the redirect
            window.location.href = response.url;
          } else {
            // If error, show the error message
            const errorText = await response.text();
            setError(errorText || "Login failed. Please contact support.");
            setIsLoggingIn(false);
          }
        } catch (err) {
          setError("Login failed. Please try again later.");
          setIsLoggingIn(false);
        }
      }
    };
    
    // Run auto-login when component mounts
    autoLogin();
  }, [slug, isLoggingIn]);
  
  return (
    <>
      <Head>
        <title>{`${companyName} - Portal Login`}</title>
      </Head>
      <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '500px', margin: '40px auto', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '8px', textAlign: 'center' }}>
        <h1 style={{ color: '#1e3a8a' }}>{companyName}</h1>
        {error ? (
          <div>
            <p style={{ marginBottom: '20px', color: '#b91c1c' }}>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#1e40af', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'inline-block', margin: '20px 0' }}>
              <div className="loader" style={{
                border: '5px solid #f3f3f3',
                borderTop: '5px solid #3498db',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                animation: 'spin 2s linear infinite',
                margin: '0 auto'
              }}></div>
              <style jsx>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
            <p>Logging into your HVAC business portal...</p>
          </div>
        )}
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const slug = query.slug as string;
  if (!slug) return { notFound: true };

  // Get the company and user data
  const [company, preview] = await Promise.all([
    portalDb.getCompany(slug),
    portalDb.getPreviewUser(slug)
  ]);
  
  if (!company || !preview) return { notFound: true };
  
  return { 
    props: { 
      slug, 
      username: preview.username,
      companyName: company.name || 'HVAC Company',
      // Auto-retrieve the password from the database
      password: preview.password || 'ccfaed27'
    } 
  };
};