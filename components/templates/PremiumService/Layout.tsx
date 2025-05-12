
import React from 'react';
import Head from 'next/head';
import Header from './Header';
import Hero from './Hero';
import Offer from './Offer';
import Services from './Services';
import Reviews from './Reviews';
import ServiceArea from './ServiceArea';
import Footer from './Footer';
import { Company } from '@/types';

interface LayoutProps {
  company: Company;
  title?: string;
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ 
  company, 
  title = "Premium HVAC Services",
  children 
}) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={`${company.name} - Professional HVAC services in ${company.city || 'your area'}`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="flex flex-col min-h-screen">
        <Header company={company} />
        <main className="flex-grow">
          <Hero company={company} />
          <Offer company={company} />
          <Services company={company} />
          <Reviews company={company} />
          <ServiceArea company={company} />
          {children}
        </main>
        <Footer company={company} />
      </div>
    </>
  );
};

export default Layout;
