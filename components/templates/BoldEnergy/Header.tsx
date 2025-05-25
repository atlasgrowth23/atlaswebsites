import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Company } from '@/types';

interface HeaderProps {
  company: Company;
}

const Header: React.FC<HeaderProps> = ({ company }) => {
  const [isScrolled, setIsScrolled] = useState(false);

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

  const showRatings = company.rating && parseFloat(String(company.rating)) > 0;

  return (
    <header className={`fixed w-full z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-gradient-to-r from-orange-600 to-red-600 shadow-xl py-2' 
        : 'bg-gradient-to-r from-orange-600/95 to-red-600/95 backdrop-blur-md py-4'
    }`}>
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex justify-between items-center">
          {/* Company Name/Logo - responsive layout */}
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-3 flex-1 min-w-0 lg:min-w-auto lg:flex-1 pr-2 lg:pr-0">
            {company.logoUrl && (
              <Image 
                src={company.logoUrl}
                alt={`${company.name} logo`}
                width={40}
                height={40}
                className="object-contain bg-white/20 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 w-[40px] h-[40px] sm:w-[48px] sm:h-[48px] lg:w-[50px] lg:h-[50px]"
              />
            )}
            {/* Mobile company name - wraps and scales */}
            <h1 className="lg:hidden text-sm sm:text-base md:text-lg font-bold tracking-tight text-white leading-tight max-w-[120px] sm:max-w-[180px] md:max-w-[240px] break-words">
              {company.name}
            </h1>
            {/* Desktop company name - original sizing */}
            <h1 className="hidden lg:block text-2xl xl:text-3xl font-bold tracking-tight text-white">
              {company.name}
            </h1>
          </div>

          {/* Phone Number - Mobile Optimized */}
          {company.phone && (
            <div className="flex items-center ml-2">
              <a 
                href={`tel:${company.phone}`}
                className="bg-yellow-500 hover:bg-yellow-400 text-orange-900 font-bold py-2 px-2 sm:px-3 lg:px-6 rounded-lg text-xs sm:text-sm lg:text-base transition-all duration-300 hover:shadow-lg whitespace-nowrap"
              >
                <span className="hidden sm:inline">📞 </span>{company.phone}
              </a>
            </div>
          )}

          {/* Rating Section - right aligned */}
          <div className="hidden lg:flex items-center space-x-3 flex-1 justify-end">
            {showRatings && (
              <div className="bg-white/20 py-2 px-4 rounded-lg shadow-lg border-l border-t border-white/30">
                <div className="flex items-center">
                  <div className="text-yellow-300 flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </div>
                  <span className="ml-2 text-white font-bold">{typeof company.rating === 'number' ? company.rating.toFixed(1) : company.rating}</span>
                </div>
                <p className="text-xs text-white/80 font-medium">Trusted Service</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;