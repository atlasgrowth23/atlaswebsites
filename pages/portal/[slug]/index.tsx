// pages/portal/[slug]/index.tsx
import { GetServerSideProps } from "next";
import { parse } from "cookie";
import crypto from "crypto";
import { portalDb } from "../../../lib/portalDb";
import { useState } from "react";
import Head from "next/head";
import Link from "next/link";

interface Props { 
  companyName: string; 
  slug: string;
  companyData: any;
}

export default function Portal({ companyName, slug, companyData }: Props) {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  return (
    <>
      <Head>
        <title>{`${companyName} - Portal`}</title>
      </Head>
      <div style={{ 
        display: 'flex', 
        minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
      }}>
        {/* Sidebar */}
        <div style={{ 
          width: '250px', 
          backgroundColor: '#1e3a8a', 
          color: 'white',
          padding: '20px 0',
          position: 'relative'
        }}>
          <div style={{ padding: '0 20px', marginBottom: '30px' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{companyName}</h2>
            <p style={{ fontSize: '0.875rem', opacity: 0.7, marginTop: '5px' }}>HVAC Business Portal</p>
          </div>
          
          <nav>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}
                  style={{ 
                    display: 'block',
                    padding: '12px 20px',
                    color: 'white',
                    textDecoration: 'none',
                    backgroundColor: activeTab === 'dashboard' ? '#2c4f9c' : 'transparent',
                    borderLeft: activeTab === 'dashboard' ? '4px solid white' : '4px solid transparent',
                  }}
                >
                  Dashboard
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); setActiveTab('contacts'); }}
                  style={{ 
                    display: 'block',
                    padding: '12px 20px',
                    color: 'white',
                    textDecoration: 'none',
                    backgroundColor: activeTab === 'contacts' ? '#2c4f9c' : 'transparent',
                    borderLeft: activeTab === 'contacts' ? '4px solid white' : '4px solid transparent',
                  }}
                >
                  Contacts
                </a>
              </li>
            </ul>
          </nav>
          
          <div style={{ padding: '20px', position: 'absolute', bottom: '0', width: 'calc(100% - 40px)' }}>
            <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Logged in as {companyName}</p>
            <Link href="/">
              <a style={{ 
                display: 'block',
                textAlign: 'center',
                padding: '8px',
                backgroundColor: '#0f2259',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}>
                Back to Website
              </a>
            </Link>
          </div>
        </div>
        
        {/* Main content */}
        <div style={{ flex: 1, padding: '20px', backgroundColor: '#f7f9fc' }}>
          {activeTab === 'dashboard' && (
            <div>
              <h1 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>Dashboard</h1>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                gap: '20px',
                marginBottom: '30px'
              }}>
                <div style={{ 
                  backgroundColor: 'white', 
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', 
                  borderRadius: '8px',
                  padding: '20px'
                }}>
                  <h3 style={{ margin: 0, marginBottom: '10px' }}>Company Info</h3>
                  <p style={{ margin: '5px 0', fontSize: '0.9rem' }}><strong>Location:</strong> {companyData.city}, {companyData.state}</p>
                  <p style={{ margin: '5px 0', fontSize: '0.9rem' }}><strong>Phone:</strong> {companyData.phone}</p>
                  <p style={{ margin: '5px 0', fontSize: '0.9rem' }}><strong>Website:</strong> {companyData.site || 'N/A'}</p>
                </div>
                
                <div style={{ 
                  backgroundColor: 'white', 
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', 
                  borderRadius: '8px',
                  padding: '20px'
                }}>
                  <h3 style={{ margin: 0, marginBottom: '10px' }}>Online Reputation</h3>
                  <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#22c55e' }}>{companyData.rating} <span style={{ fontSize: '1rem', color: '#555' }}>/ 5</span></p>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>{companyData.reviews} reviews</p>
                </div>
              </div>
              
              <div style={{ 
                backgroundColor: 'white', 
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', 
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h3 style={{ marginTop: 0 }}>Recent Activity</h3>
                <p>Your dashboard will show recent activities and analytics here.</p>
              </div>
            </div>
          )}
          
          {activeTab === 'contacts' && (
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px' 
              }}>
                <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Contacts</h1>
                <button style={{ 
                  backgroundColor: '#1e3a8a',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}>
                  Add New Contact
                </button>
              </div>
              
              <div style={{ 
                backgroundColor: 'white', 
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', 
                borderRadius: '8px',
                padding: '20px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  borderBottom: '1px solid #eee',
                  paddingBottom: '10px',
                  marginBottom: '10px',
                  fontWeight: 'bold'
                }}>
                  <div style={{ width: '30%' }}>Name</div>
                  <div style={{ width: '30%' }}>Email</div>
                  <div style={{ width: '25%' }}>Phone</div>
                  <div style={{ width: '15%' }}>Actions</div>
                </div>
                
                <div style={{ color: '#666', textAlign: 'center', padding: '40px 20px' }}>
                  <p>No contacts yet. Click "Add New Contact" to get started.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, params }) => {
  const slug = params!.slug as string;
  const session = parse(req.headers.cookie || "").session || "";
  const [val, sig] = Buffer.from(session, "base64").toString().split(".");
  const good =
    val === slug &&
    crypto
      .createHmac("sha256", process.env.SESSION_SECRET!)
      .update(val)
      .digest("hex") === sig;

  if (!good) {
    return { redirect: { destination: `/login?slug=${slug}`, permanent: false } };
  }

  const company = await portalDb.getCompany(slug);
  if (!company) {
    return { notFound: true };
  }
  
  return { 
    props: { 
      companyName: company.name || slug, 
      slug,
      companyData: {
        city: company.city || 'N/A',
        state: company.state || 'N/A',
        phone: company.phone || 'N/A',
        rating: company.rating || 0,
        reviews: company.reviews || 0,
        site: company.site || ''
      }
    } 
  };
};