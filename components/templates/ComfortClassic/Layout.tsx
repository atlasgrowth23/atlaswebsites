import React from 'react';
import Head from 'next/head';
import { Company } from '@/types';

interface LayoutProps {
  company: Company;
}

const Layout: React.FC<LayoutProps> = ({ company }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>{`${company?.name || 'HVAC Services'} | Professional Heating & Cooling`}</title>
        <meta name="description" content={`${company?.name || 'Our company'} provides professional HVAC services for your home or business. Contact us today for expert heating and cooling solutions.`} />
      </Head>
      
      {/* Placeholder for header */}
      <header className="bg-blue-700 text-white p-6">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">{company.name}</h1>
          <p className="mt-2">Professional Heating & Cooling Services</p>
        </div>
      </header>
      
      <main className="flex-grow">
        {/* Hero section */}
        <section className="bg-blue-600 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-bold mb-4">
                Expert HVAC Services in {company.city || 'Your Area'}
              </h1>
              <p className="text-xl mb-6">
                Reliable heating and cooling solutions for your home or business.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="tel:123-456-7890" className="bg-white text-blue-700 font-semibold py-3 px-6 rounded-lg text-center">
                  Call Now: {company.phone || '(555) 123-4567'}
                </a>
                <button className="bg-yellow-500 text-blue-900 font-semibold py-3 px-6 rounded-lg text-center">
                  Schedule Service
                </button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Services section */}
        <section className="py-16 bg-gray-100">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">HVAC Installation</h3>
                <p className="text-gray-600">
                  Professional installation of heating and cooling systems to ensure maximum efficiency and comfort.
                </p>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">Maintenance & Repairs</h3>
                <p className="text-gray-600">
                  Regular maintenance and prompt repairs to keep your systems running smoothly year-round.
                </p>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">Emergency Service</h3>
                <p className="text-gray-600">
                  24/7 emergency service to address urgent heating and cooling problems.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="bg-blue-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">{company.name}</h3>
              <address className="not-italic">
                {company.street || company.full_address || '123 Main St'}<br />
                {company.city || 'City'}, {company.state || 'State'} {company.postal_code || '12345'}
              </address>
              <p className="mt-4">
                <a href={`tel:${company.phone}`} className="text-blue-300 hover:text-white">
                  {company.phone || '(555) 123-4567'}
                </a>
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Hours of Operation</h3>
              <ul className="space-y-2">
                <li>Monday - Friday: 8:00 AM - 6:00 PM</li>
                <li>Saturday: 9:00 AM - 2:00 PM</li>
                <li>Sunday: Closed</li>
                <li className="font-semibold mt-2">24/7 Emergency Service Available</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-blue-800 text-center">
            <p>© {new Date().getFullYear()} {company.name}. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;