import React from 'react';
import Head from 'next/head';
import { Company } from '@/types';
import Header from './Header';
import Hero from './Hero';
import About from './About';
import Services from './Services';
import Reviews from './Reviews';
import ServiceArea from './ServiceArea';
import Footer from './Footer';

interface LayoutProps {
  company: Company;
}

const Layout: React.FC<LayoutProps> = ({ company }) => {


  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>{`${company?.name || 'HVAC Services'} | Professional Air Conditioning & Heating`}</title>
        <meta name="description" content={`${company?.name || 'Our company'} provides professional HVAC services for your home or business. Contact us today for expert heating and cooling solutions.`} />
        
        {/* Open Graph tags for clean previews */}
        <meta property="og:title" content={`${company?.name || 'HVAC Services'} | Professional Air Conditioning & Heating`} />
        <meta property="og:description" content={`${company?.name || 'Our company'} provides professional HVAC services for your home or business. Contact us today for expert heating and cooling solutions.`} />
        <meta property="og:type" content="website" />
        {company?.logoUrl && (
          <meta property="og:image" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com'}${company.logoUrl}`} />
        )}
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${company?.name || 'HVAC Services'} | Professional Air Conditioning & Heating`} />
        <meta name="twitter:description" content={`${company?.name || 'Our company'} provides professional HVAC services for your home or business. Contact us today for expert heating and cooling solutions.`} />
        {company?.logoUrl && (
          <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com'}${company.logoUrl}`} />
        )}
      </Head>
      
      <Header company={company} />
      <main className="flex-grow pt-16"> {/* Add padding top to account for fixed header */}
        <Hero company={company} />
        <About company={company} />
        <Services company={company} />
        <Reviews company={company} />
        <ServiceArea company={company} />
      </main>
      <Footer company={company} />
      
      {/* Login reminder */}
      <div className="hidden">Chat widget loaded</div>
    </div>
  );
};

export default Layout;