import React from 'react';
import Head from 'next/head';
import Script from 'next/script';
import { Company } from '@/types';
import Header from './Header';
import Hero from './Hero';
import About from './About';
import Services from './Services';
import Footer from './Footer';
import Widget from '@/components/widget/Widget';

interface LayoutProps {
  company: Company;
}

const Layout: React.FC<LayoutProps> = ({ company }) => {
  // Define ComfortClassic color scheme
  const primaryColor = "#004DFF";
  const accentColor = "#FFB347";

  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>{`${company?.name || 'HVAC Services'} | Professional Air Conditioning & Heating`}</title>
        <meta name="description" content={`${company?.name || 'Our company'} provides professional HVAC services for your home or business. Contact us today for expert heating and cooling solutions.`} />
      </Head>
      
      {/* Widget Script */}
      <Script 
        src="/widget.js" 
        data-company={company?.slug || ''} 
        data-primary={primaryColor}
        data-accent={accentColor}
        strategy="afterInteractive"
      />
      
      <Header company={company} />
      <main className="flex-grow pt-16"> {/* Add padding top to account for fixed header */}
        <Hero company={company} />
        <About company={company} />
        <Services company={company} />
      </main>
      <Footer company={company} />
      {/* Add New Lead Generation Widget */}
      <Widget 
        companySlug={company?.slug || ''} 
        primaryColor={primaryColor}
        accentColor={accentColor}
      />
    </div>
  );
};

export default Layout;