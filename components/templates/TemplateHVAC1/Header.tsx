import React from 'react';
import Link from 'next/link';
import { Company } from '@/types';

interface HeaderProps {
  company: Company;
  logoUrl: string | null;
}

const Header: React.FC<HeaderProps> = ({ company, logoUrl }) => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto py-4 px-4 flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center mb-4 md:mb-0">
          {logoUrl ? (
            <div className="w-16 h-16 mr-4 flex-shrink-0">
              <img src={logoUrl} alt={`${company.name} logo`} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-16 h-16 mr-4 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold">{company.name.charAt(0)}</span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{company.name}</h1>
            <p className="text-sm text-gray-600">{company.city}, {company.state}</p>
          </div>
        </div>
        
        <nav className="flex flex-wrap justify-center md:justify-end gap-6">
          <Link href="#about" className="text-slate-600 hover:text-slate-900">
            About
          </Link>
          <Link href="#services" className="text-slate-600 hover:text-slate-900">
            Services
          </Link>
          <Link href="#reviews" className="text-slate-600 hover:text-slate-900">
            Reviews
          </Link>
          <Link href="#contact" className="text-slate-600 hover:text-slate-900">
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
