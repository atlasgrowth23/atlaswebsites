// pages/login.tsx
import { GetServerSideProps } from "next";
import Head from "next/head";
import { portalDb } from "../lib/portalDb";
import { useState } from "react";

interface Props {
  slug: string;
  username: string;
  companyName: string;
}

export default function LoginPage({ slug, username, companyName }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError("Password is required");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    // Submit the form programmatically using fetch
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug,
          username,
          password
        }),
      });
      
      if (response.redirected) {
        // If successful login, follow the redirect
        window.location.href = response.url;
      } else {
        // If error, show the error message
        const errorText = await response.text();
        setError(errorText || "Login failed. Please check your password and try again.");
        setIsSubmitting(false);
      }
    } catch (err) {
      setError("Login failed. Please try again.");
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <Head><title>{companyName} - Portal Login</title></Head>
      <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '500px', margin: '40px auto', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
        <h1 style={{ textAlign: 'center', color: '#1e3a8a' }}>{companyName}</h1>
        <p style={{ textAlign: 'center', marginBottom: '20px' }}>Enter your password to access your HVAC business dashboard</p>
        
        {error && <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '8px 12px', borderRadius: '4px', marginBottom: '20px' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Company ID</label>
            <input
              name="slug"
              value={slug}
              readOnly
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#f3f4f6' }}
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Username</label>
            <input
              name="username"
              value={username}
              readOnly
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#f3f4f6' }}
            />
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Password</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
            />
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            style={{ 
              width: '100%', 
              padding: '10px', 
              backgroundColor: isSubmitting ? '#9ca3af' : '#1e40af', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              fontWeight: 'bold', 
              cursor: isSubmitting ? 'not-allowed' : 'pointer' 
            }}
          >
            {isSubmitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>
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
      companyName: company.name || 'HVAC Company'
    } 
  };
};