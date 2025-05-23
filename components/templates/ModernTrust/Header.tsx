import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Company } from '@/types';

interface HeaderProps {
  company: Company;
}

const Header: React.FC<HeaderProps> = ({ company }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if ratings should be shown (rating > 4.8)
  const showRatings = company.rating && company.rating >= 4.8;

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
    <header className={`fixed w-full z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-gradient-to-r from-blue-900 to-blue-700 shadow-xl py-2' 
        : 'bg-gradient-to-r from-blue-900/90 to-blue-700/90 backdrop-blur-md py-4'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Company Name/Logo with simplified styling (no underline) */}
          <div className="flex items-center space-x-3">
            {company.logoUrl && (
              <Image 
                src={company.logoUrl}
                alt={`${company.name} logo`}
                width={50}
                height={50}
                className="object-contain bg-white/10 backdrop-blur-sm rounded-lg p-2"
              />
            )}
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              {company.name}
            </h1>
          </div>

          {/* Navigation with improved typography and layout */}
          <nav className="hidden md:flex items-center space-x-8">
            {['About', 'Services', 'Contact'].map((item) => (
              <Link 
                key={item}
                href={`#${item.toLowerCase()}`} 
                className="text-lg font-medium text-white hover:text-blue-200 transition-colors"
              >
                {item}
              </Link>
            ))}

          </nav>

          {/* Rating/Reviews Section - conditionally displayed */}
          <div className="hidden md:flex items-center space-x-3">
            {showRatings && (
              <div className="bg-white/10 py-2 px-4 rounded-lg shadow-lg border-l border-t border-white/20">
                <div className="flex items-center">
                  <div className="text-yellow-400 flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </div>
                  <span className="ml-2 text-white font-bold">{typeof company.rating === 'number' ? company.rating.toFixed(1) : company.rating}</span>
                </div>
                <p className="text-xs text-white/80 font-medium">Trusted HVAC Service</p>
              </div>
            )}

            {/* Phone Number */}
            {company.phone && (
              <a 
                href={`tel:${company.phone ? company.phone.replace(/^\+1\s?/, '') : ''}`} 
                className="group bg-gradient-to-br from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-5 py-3 rounded-lg transition-all font-bold flex items-center shadow-lg hover:shadow-red-500/30 transform hover:-translate-y-0.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {company.phone ? company.phone.replace(/^\+1\s?/, '') : ''}
              </a>
            )}
          </div>

          {/* Mobile header elements */}
          <div className="flex items-center md:hidden">
            {/* Show phone with number on mobile */}
            {company.phone && (
              <a 
                href={`tel:${company.phone ? company.phone.replace(/^\+1\s?/, '') : ''}`} 
                className="bg-gradient-to-r from-red-600 to-red-500 text-white px-3 py-2 rounded-lg flex items-center font-bold shadow-md mr-3"
                aria-label="Call us"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-sm whitespace-nowrap">{company.phone ? company.phone.replace(/^\+1\s?/, '') : ''}</span>
              </a>
            )}

            {/* Mobile Menu Button */}
            <button 
              className="text-white focus:outline-none p-2 rounded-md"
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
          <div className="md:hidden mt-4 pb-4 pt-2 border-t border-blue-500/30">
            <nav className="flex flex-col space-y-4">
              {['About', 'Services', 'Contact'].map((item) => (
                <Link 
                  key={item}
                  href={`#${item.toLowerCase()}`} 
                  className="text-lg text-white font-medium transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </Link>
              ))}

            </nav>
            
            {/* Mobile reviews badge - only if ratings should show */}
            {showRatings && (
              <div className="mt-4 bg-white/10 p-3 rounded-lg flex items-center">
                <div className="text-yellow-400 flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
                <div className="ml-2">
                  <span className="text-sm font-bold text-white">{company.rating?.toFixed(1)}</span>
                  <span className="text-xs text-white/70 ml-1">(Verified)</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;