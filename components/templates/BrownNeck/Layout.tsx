
import React from 'react';
import Head from 'next/head';
import { Company } from '@/types';

interface LayoutProps {
  title: string;
  description: string;
  company: Company;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ 
  title, 
  description, 
  company, 
  children 
}) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph / Social Media Meta Tags */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        {company.site_url && <meta property="og:url" content={company.site_url} />}
        
        {/* Schema.org markup for Google */}
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": company.name,
              "address": {
                "@type": "PostalAddress",
                "streetAddress": company.address,
                "addressLocality": company.city,
                "addressRegion": company.state,
                "postalCode": company.zip,
                "addressCountry": "US"
              },
              "telephone": company.phone,
              "priceRange": "$$",
              "description": description
            })
          }}
        />
      </Head>

      <div className="flex flex-col min-h-screen bg-amber-50">
        {/* Header would go here */}
        <header className="bg-amber-900 text-white py-4">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <div className="text-xl font-bold">{company.name}</div>
            <nav className="hidden md:block">
              <ul className="flex space-x-6">
                <li><a href="#" className="hover:text-amber-200 transition-colors">Home</a></li>
                <li><a href="#about" className="hover:text-amber-200 transition-colors">About</a></li>
                <li><a href="#services" className="hover:text-amber-200 transition-colors">Services</a></li>
                <li><a href="#contact" className="hover:text-amber-200 transition-colors">Contact</a></li>
              </ul>
            </nav>
            <div className="md:hidden">
              <button className="text-white">
                Menu
              </button>
            </div>
          </div>
        </header>

        <main className="flex-grow">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="bg-amber-900 text-white py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">{company.name}</h3>
                <p className="mb-2">{company.address}</p>
                <p className="mb-2">{company.city}, {company.state} {company.zip}</p>
                <p className="mb-2">Phone: {company.phone}</p>
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-4">Services</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-amber-200 transition-colors">AC Repair</a></li>
                  <li><a href="#" className="hover:text-amber-200 transition-colors">Heating Installation</a></li>
                  <li><a href="#" className="hover:text-amber-200 transition-colors">Duct Cleaning</a></li>
                  <li><a href="#" className="hover:text-amber-200 transition-colors">Maintenance Plans</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-4">Hours</h3>
                <ul className="space-y-1">
                  <li>Monday - Friday: 8am - 6pm</li>
                  <li>Saturday: 9am - 4pm</li>
                  <li>Sunday: Closed</li>
                  <li className="mt-4 text-amber-200">24/7 Emergency Service Available</li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-amber-700 mt-8 pt-6 text-center text-sm">
              <p>&copy; {new Date().getFullYear()} {company.name}. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Layout;
