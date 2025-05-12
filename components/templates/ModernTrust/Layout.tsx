import React from 'react';
import Head from 'next/head';
import { Company } from '@/types';
import Hero from './Hero';
import About from './About';
import Services from './Services';

interface LayoutProps {
  company: Company;
}

const Layout: React.FC<LayoutProps> = ({ company }) => {
  return (
    <>
      <Head>
        <title>{`${company.name} | Professional HVAC Services`}</title>
        <meta name="description" content={`${company.name} provides professional HVAC services including installation, repair, and maintenance.`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main>
        <Hero company={company} />
        <About company={company} />
        <Services company={company} />
      </main>

      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} {company.name}. All rights reserved.</p>
          {company.phone && (
            <p className="mt-2">
              Contact us: <a href={`tel:${company.phone}`} className="text-blue-300 hover:text-blue-200">{company.phone}</a>
            </p>
          )}
        </div>
      </footer>
    </>
  );
};

export default Layout;