// pages/login.tsx
import { GetServerSideProps } from "next";
import Head from "next/head";
import { portalDb } from "../lib/portalDb";
import { useState } from "react";

interface Props {
  slug: string;
  username: string;
  password: string;
  showForm: boolean;
}

export default function LoginPage({ slug, username, password, showForm }: Props) {
  const [formPassword, setFormPassword] = useState(password);
  const [error, setError] = useState("");
  
  // If we have password from the URL and showForm is false, auto-submit
  if (password && !showForm) {
    return (
      <>
        <Head><title>Logging you in…</title></Head>
        <form
          id="autoForm"
          method="POST"
          action="/api/auth/login"
          style={{ display: "none" }}
        >
          <input name="slug" value={slug} readOnly />
          <input name="username" value={username} readOnly />
          <input name="password" value={password} readOnly />
        </form>
        <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '500px', margin: '40px auto', textAlign: 'center', padding: '20px' }}>
          <h1>HVAC Portal Login</h1>
          <p>Redirecting to your company portal...</p>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.getElementById("autoForm").submit();`
          }}
        />
      </>
    );
  }
  
  // Otherwise, show the manual login form
  return (
    <>
      <Head><title>HVAC Company Portal Login</title></Head>
      <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '500px', margin: '40px auto', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
        <h1 style={{ textAlign: 'center', color: '#1e3a8a' }}>Company Portal</h1>
        <p style={{ textAlign: 'center', marginBottom: '20px' }}>Enter your credentials to access your HVAC business dashboard</p>
        
        {error && <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '8px 12px', borderRadius: '4px', marginBottom: '20px' }}>{error}</div>}
        
        <form 
          method="POST" 
          action="/api/auth/login"
          onSubmit={(e) => {
            if (!formPassword.trim()) {
              e.preventDefault();
              setError("Password is required");
            }
          }}
        >
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
              value={formPassword}
              onChange={(e) => {
                setFormPassword(e.target.value);
                if (error) setError("");
              }}
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
            />
          </div>
          
          <button
            type="submit"
            style={{ width: '100%', padding: '10px', backgroundColor: '#1e40af', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Log In
          </button>
        </form>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const slug = query.slug as string;
  if (!slug) return { notFound: true };

  const preview = await portalDb.getPreviewUser(slug);
  if (!preview) return { notFound: true };

  // Use the password directly from the URL query parameter
  const password = query.pwd as string || ""; 
  
  // If the showForm query parameter is set, show form even if password is provided
  const showForm = query.showForm === "true";
  
  return { 
    props: { 
      slug, 
      username: preview.username, 
      password,
      showForm
    } 
  };
};