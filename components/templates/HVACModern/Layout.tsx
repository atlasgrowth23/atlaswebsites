import React from 'react';
import { Company } from '@/types';
import Header from './Header';
import Hero from './Hero';

interface LayoutProps {
  company: Company;
}

const Layout: React.FC<LayoutProps> = ({ company }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header company={company} />
      <main className="flex-grow">
        <Hero company={company} />
        {/* Other sections would go here */}
      </main>
      {/* Footer would go here */}
    </div>
  );
};

export default Layout;