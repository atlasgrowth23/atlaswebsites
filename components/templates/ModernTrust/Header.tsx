
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Company } from '@/types';

interface HeaderProps {
  company: Company;
}

const Header: React.FC<HeaderProps> = ({ company }) => {
  return (
    <header className="fixed w-full bg-white shadow-md z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            {company.logo_url ? (
              <Image 
                src={company.logo_url} 
                alt={`${company.name} logo`}
                width={180}
                height={60}
                className="h-12 w-auto object-contain"
              />
            ) : (
              <h1 className="text-2xl font-bold text-blue-600">{company.name}</h1>
            )}
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="#about" className="text-gray-700 hover:text-blue-600 font-medium">
              About
            </Link>
            <Link href="#services" className="text-gray-700 hover:text-blue-600 font-medium">
              Services
            </Link>
            <Link href="#contact" className="text-gray-700 hover:text-blue-600 font-medium">
              Contact
            </Link>
          </nav>
          
          {/* Phone Number */}
          {company.phone && (
            <div className="hidden md:block">
              <a 
                href={`tel:${company.phone}`} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors font-medium"
              >
                {company.phone}
              </a>
            </div>
          )}
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button className="text-gray-700 focus:outline-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
