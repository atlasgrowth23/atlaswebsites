import React, { ReactNode, useEffect } from 'react';
import Head from 'next/head';
import { Company } from '@/types';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  company?: Company;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title, 
  description,
  company 
}) => {

  // Add tracking beacon
  useEffect(() => {
    if (company?.biz_id) {
      navigator.sendBeacon('/api/track', JSON.stringify({
        companyId: company.biz_id,
        path: window.location.pathname
      }));
    }
  }, [company]);

  // Generate title and description based on company info
  const pageTitle = title || `${company?.name || 'HVAC Services'} | Professional Heating & Cooling`;
  const pageDescription = description || 
    `${company?.name || 'Our company'} provides professional heating, cooling, and air quality services for residential and commercial properties. ${company?.site_company_insights_description || ''}`;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header company={company} />

      <main className="flex-grow">
        {children}
      </main>

      <Footer company={company} />
    </div>
  );
};

export default Layout;