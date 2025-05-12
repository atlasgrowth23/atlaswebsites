import React, { ReactNode, useEffect } from 'react';
import Head from 'next/head';
import { Company } from '@/types';
import ChatWidget from '@/components/chat/ChatWidget';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  company?: Company;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title = 'HVAC Services', 
  description = 'Professional HVAC services for your home or business', 
  company 
}) => {
  
  // Add tracking beacon
  useEffect(() => {
    if (company?.id) {
      navigator.sendBeacon('/api/track', JSON.stringify({
        companyId: company.id,
        path: window.location.pathname
      }));
    }
  }, [company]);

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-gray-900 text-white py-6 text-center">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} {company?.name || 'HVAC Company'}. All rights reserved.</p>
        </div>
      </footer>
      
      {/* Add Chat Widget only if company data is available */}
      {company && <ChatWidget company={company} />}
    </div>
  );
};

export default Layout;