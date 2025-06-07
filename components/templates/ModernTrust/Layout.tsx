import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Company } from '@/types';
import Header from './Header';
import Hero from './Hero';
import About from './About';
import Services from './Services';
import CustomerReviews from './CustomerReviews';
import GoogleReviews from './GoogleReviews';
import ServiceArea from './ServiceArea';
import Footer from './Footer';
import SimpleTracker from '@/components/SimpleTracker';
import ChatWidget from '@/components/ChatWidget';

interface LayoutProps {
  company: Company;
}

const Layout: React.FC<LayoutProps> = ({ company }) => {
  const router = useRouter();
  
  // Check if this is a preview mode (should NOT track analytics)
  const isPreview = router.query.preview === 'true';

  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>{`${company?.name || 'Professional Services'} | Trusted Local Business`}</title>
        <meta name="description" content={`${company?.name || 'Our company'} provides professional services for your home or business. Contact us today for expert solutions.`} />
        
        {/* Mobile optimization */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <meta name="format-detection" content="telephone=yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* Critical meta tags for link previews - must be at the top */}
        <meta property="og:title" content={`${company?.name || 'Professional Services'}`} />
        <meta property="twitter:title" content={`${company?.name || 'Professional Services'}`} />
        
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
        
        {/* Performance hints */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        

      </Head>
      
      <Header company={company} />
      <main className="flex-grow pt-16"> {/* Add padding top to account for fixed header */}
        <Hero company={company} />
        <About company={company} />
        <Services company={company} />
        <CustomerReviews company={company} />
        <ServiceArea company={company} />
      </main>
      <Footer company={company} />
      
      
      {/* Analytics tracking - only when NOT in preview mode */}
      {!isPreview && <SimpleTracker companyId={company.id} />}
      
      {/* Chat Widget - always show for testing */}
      <ChatWidget 
        companyId={company.id}
        companyName={company.name}
        companyHours={company.parsed_working_hours}
        companyLocation={{
          latitude: company.latitude,
          longitude: company.longitude
        }}
        companyLogo={company.logoUrl}
      />
    </div>
  );
};

export default Layout;