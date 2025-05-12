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
    <header className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-lg py-2' : 'bg-white py-4'}`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Company Name - single color now */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-700 tracking-tight">
              {company.name}
            </h1>
          </div>

          {/* Navigation with more attractive styling */}
          <nav className="hidden md:flex items-center">
            {['About', 'Services', 'Contact'].map((item, index) => (
              <Link 
                key={item}
                href={`#${item.toLowerCase()}`} 
                className="relative px-5 py-2 mx-1 font-medium text-gray-700 overflow-hidden group"
              >
                <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
                  {item}
                </span>
                <span className="absolute bottom-0 left-0 w-full h-0 bg-blue-600 transition-all duration-300 group-hover:h-full -z-0"></span>
              </Link>
            ))}
          </nav>

          {/* Rating/Reviews Section */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="bg-gray-50 px-3 py-1.5 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="text-yellow-400 flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
                <span className="ml-1 text-sm font-semibold text-gray-700">5.0</span>
              </div>
              <p className="text-xs text-gray-500 font-medium">120+ Reviews</p>
            </div>

            {/* Phone Number */}
            {company.phone && (
              <a 
                href={`tel:${company.phone}`} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-md transition-colors font-medium flex items-center shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {company.phone}
              </a>
            )}
          </div>

          {/* Mobile header elements */}
          <div className="flex items-center md:hidden">
            {/* Show compact ratings on mobile */}
            <div className="flex items-center mr-3">
              <div className="text-yellow-400 flex">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </div>
              <span className="ml-1 text-xs font-semibold text-gray-700">5.0</span>
            </div>

            {/* Compact phone on mobile */}
            {company.phone && (
              <a 
                href={`tel:${company.phone}`} 
                className="bg-blue-600 text-white p-2 rounded-md mr-3"
                aria-label="Call us"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </a>
            )}

            {/* Mobile Menu Button */}
            <button 
              className="text-gray-700 focus:outline-none p-1"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 pt-2 border-t border-gray-100">
            <nav className="flex flex-col space-y-1">
              {['About', 'Services', 'Contact'].map((item) => (
                <Link 
                  key={item}
                  href={`#${item.toLowerCase()}`} 
                  className="text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors py-3 px-4 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;