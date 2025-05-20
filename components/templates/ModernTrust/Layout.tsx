import React, { useEffect } from 'react';
import Head from 'next/head';
import { Company } from '@/types';
import Header from './Header';
import Hero from './Hero';
import About from './About';
import Services from './Services';
import Reviews from './Reviews';
import ServiceArea from './ServiceArea';
import Footer from './Footer';
import Script from 'next/script';

interface LayoutProps {
  company: Company;
}

const Layout: React.FC<LayoutProps> = ({ company }) => {
  // Add chat widget initialization
  useEffect(() => {
    // Load chat widget from public folder
    const script = document.createElement('script');
    script.src = '/chat-widget.js';
    script.async = true;
    script.onload = () => {
      // Initialize chat widget with company info after loading
      if (typeof window !== 'undefined' && (window as any)['HVACChatWidget']) {
        // Use bracket notation to avoid TypeScript errors
        const chatWidget = (window as any)['HVACChatWidget'];
        chatWidget.init({
          slug: company.slug,
          name: company.name
        });
      }
    };
    document.body.appendChild(script);

    // Cleanup function to remove script when component unmounts
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [company]);

  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>{`${company?.name || 'HVAC Services'} | Professional Air Conditioning & Heating`}</title>
        <meta name="description" content={`${company?.name || 'Our company'} provides professional HVAC services for your home or business. Contact us today for expert heating and cooling solutions.`} />
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