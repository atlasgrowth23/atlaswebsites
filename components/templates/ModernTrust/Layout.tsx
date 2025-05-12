
import React from 'react';
import Head from 'next/head';
import { Company } from '@/types';
import Hero from './Hero';
import About from './About';

interface LayoutProps {
  company: Company;
}

const Layout: React.FC<LayoutProps> = ({ company }) => {
  return (
    <>
      <Head>
        <title>{company.name} | Professional HVAC Services</title>
        <meta name="description" content={`${company.name} provides professional HVAC services in ${company.city}, ${company.state}.`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="flex flex-col min-h-screen">
        <header className="bg-white shadow-md py-4">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <div className="font-bold text-2xl text-blue-600">{company.name}</div>
            <nav>
              <ul className="flex space-x-6">
                <li><a href="#home" className="hover:text-blue-600">Home</a></li>
                <li><a href="#about" className="hover:text-blue-600">About</a></li>
                <li><a href="#services" className="hover:text-blue-600">Services</a></li>
                <li><a href="#contact" className="hover:text-blue-600">Contact</a></li>
              </ul>
            </nav>
          </div>
        </header>
        
        <main className="flex-grow">
          <section id="home">
            <Hero company={company} />
          </section>
          
          <section id="about" className="py-16">
            <About company={company} />
          </section>
          
          {/* Additional sections can be added here */}
        </main>
        
        <footer className="bg-gray-800 text-white py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">{company.name}</h3>
                <p>Providing trusted HVAC services since 1985</p>
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-4">Contact Us</h3>
                <p>{company.address}, {company.city}, {company.state}</p>
                <p>Phone: {company.phone}</p>
                <p>Email: {company.email || 'info@example.com'}</p>
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-4">Hours</h3>
                <p>Monday - Friday: 8am - 6pm</p>
                <p>Saturday: 9am - 2pm</p>
                <p>Sunday: Closed</p>
              </div>
            </div>
            
            <div className="border-t border-gray-700 mt-8 pt-8 text-center">
              <p>&copy; {new Date().getFullYear()} {company.name}. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Layout;
