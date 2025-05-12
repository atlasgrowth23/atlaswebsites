
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Company } from '@/types';

interface HeaderProps {
  company: Company;
}

const Header: React.FC<HeaderProps> = ({ company }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-lg py-2' : 'bg-transparent py-4'}`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Company Logo/Name */}
          <div className="flex items-center">
            <h1 className={`text-2xl font-bold tracking-tight ${isScrolled ? 'text-blue-800' : 'text-white'}`}>
              {company.name}
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center">
            {['Services', 'Reviews', 'Areas', 'Contact'].map((item) => (
              <Link 
                key={item}
                href={`#${item.toLowerCase()}`} 
                className={`relative px-4 py-2 mx-2 font-medium ${isScrolled ? 'text-gray-700' : 'text-white'} hover:text-blue-500 transition-colors`}
              >
                {item}
              </Link>
            ))}
          </nav>

          {/* Call Button */}
          <div className="hidden md:block">
            {company.phone && (
              <a 
                href={`tel:${company.phone}`} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full transition-colors font-medium flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {company.phone}
              </a>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              className={`p-2 ${isScrolled ? 'text-gray-800' : 'text-white'}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 bg-white rounded-lg shadow-xl p-4">
            <nav className="flex flex-col space-y-3">
              {['Services', 'Reviews', 'Areas', 'Contact'].map((item) => (
                <Link 
                  key={item}
                  href={`#${item.toLowerCase()}`} 
                  className="text-gray-800 hover:text-blue-600 font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </Link>
              ))}
              {company.phone && (
                <a 
                  href={`tel:${company.phone}`} 
                  className="flex items-center text-blue-600 font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {company.phone}
                </a>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
