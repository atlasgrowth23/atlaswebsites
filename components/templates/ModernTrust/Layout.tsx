import React from 'react';
import Head from 'next/head';
import { Company } from '@/types';
import Header from './Header';
import Hero from './Hero';
import About from './About';
import Services from './Services';
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
        
        {/* Critical meta tags for link previews - must be at the top */}
        <meta property="og:title" content={`${company?.name || 'Professional Services'}`} />
        <meta property="twitter:title" content={`${company?.name || 'Professional Services'}`} />
        
        {/* Primary Meta Tags */}
        <meta name="description" content={`${company?.name || 'Our company'} provides professional services for your home or business. Contact us today for expert solutions.`} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={`${company?.name || 'Professional Services'}`} />
        <meta property="og:description" content={`${company?.name || 'Our company'} provides professional services for your home or business. Contact us today for expert solutions.`} />
        <meta property="og:image" content={company?.logoUrl || `/logos/${company?.slug}.png`} id="og-image" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:image:alt" content={`${company?.name || 'Business'} Logo`} />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:description" content={`${company?.name || 'Our company'} provides professional services for your home or business. Contact us today for expert solutions.`} />
        <meta property="twitter:image" content={company?.logoUrl || `/logos/${company?.slug}.png`} id="twitter-image" />
      </Head>
      
      <Header company={company} />
      <main className="flex-grow pt-16"> {/* Add padding top to account for fixed header */}
        <Hero company={company} />
        <About company={company} />
        <Services company={company} />
        <ServiceArea company={company} />
      </main>
      <Footer company={company} />
      
      {/* Login reminder */}
      <div className="hidden">Chat widget loaded</div>
    </div>
  );
};

export default Layout;