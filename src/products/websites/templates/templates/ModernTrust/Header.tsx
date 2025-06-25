import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Company } from '@/types';
// Logo URL is already set on company object by template page

interface HeaderProps {
  company: Company;
}

const Header: React.FC<HeaderProps> = ({ company }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Smart rating logic - hide stars under 4.5, show count for 20+ reviews
  const totalReviews = parseInt((company as any).reviews) || 0;
  const rating = parseFloat((company as any).rating) || 0;
  const showRatings = totalReviews >= 3 && rating >= 4.5;
  const showReviewCount = totalReviews >= 20 && rating >= 4.5;

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
        ? 'bg-white shadow-2xl py-3 border-b border-blue-100' 
        : 'bg-white/95 backdrop-blur-md py-4 shadow-lg'
    }`}>
      <div className="container mx-auto px-3 sm:px-4">
        {/* Mobile Layout - Professional */}
        <div className="md:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {company.logoUrl && (
                <div>
                  <Image 
                    src={company.logoUrl}
                    alt="Brand Logo"
                    width={100}
                    height={50}
                    sizes="100px"
                    className="object-contain"
                    priority
                    quality={95}
                  />
                </div>
              )}
              <div>
                <h1 className="text-sm font-bold tracking-tight text-gray-900 leading-tight break-words">
                  {company.name}
                </h1>
                {showRatings && (
                  <div className="flex items-center space-x-1 mt-1">
                    <div className="text-yellow-500 flex text-xs">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star}>★</span>
                      ))}
                    </div>
                    <span className="text-gray-600 text-xs font-medium">
                      {company.rating}/5 • {(company as any).reviews} reviews
                    </span>
                  </div>
                )}
                {(company as any).emergency_service && (
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      24/7 Emergency
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link 
                href={`tel:${company.phone}`}
                className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white px-4 py-3 rounded-lg font-bold text-sm transition-all shadow-lg hover:shadow-red-500/30 transform hover:-translate-y-0.5 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call Now
              </Link>
              
              {/* Mobile Menu Button */}
              <button 
                className="text-gray-700 focus:outline-none p-2 rounded-md hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Layout - Professional */}
        <div className="hidden md:flex justify-between items-center">
          <div className="flex items-center space-x-4 flex-1">
            {company.logoUrl && (
              <div>
                <Image 
                  src={company.logoUrl}
                  alt="Brand Logo"
                  width={140}
                  height={70}
                  sizes="(max-width: 768px) 120px, 140px"
                  className="object-contain"
                  priority
                  quality={95}
                />
              </div>
            )}
            <div>
              <h1 className="text-xl lg:text-2xl xl:text-3xl font-bold tracking-tight text-gray-900 leading-tight">
                {company.name}
              </h1>
              <div className="flex items-center space-x-4 mt-1">
                {showRatings && (
                  <div className="flex items-center space-x-2">
                    <div className="text-yellow-500 flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-gray-700 font-semibold">{Number(rating).toFixed(1)}</span>
                    {showReviewCount && (
                      <span className="text-gray-500 text-sm">({totalReviews} reviews)</span>
                    )}
                  </div>
                )}
                {(company as any).emergency_service && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    24/7 Emergency Service
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Professional Navigation */}
          <nav className="hidden lg:flex items-center space-x-8 flex-1 justify-center">
            {['About', 'Services', 'Contact'].map((item) => (
              <Link 
                key={item}
                href={`#${item.toLowerCase()}`} 
                className="text-lg font-semibold text-gray-700 hover:text-blue-600 transition-colors relative group"
              >
                {item}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
              </Link>
            ))}
          </nav>

          {/* Professional Contact Section */}
          <div className="flex items-center space-x-4 flex-1 justify-end">
            {/* Premium Phone Section */}
            {company.phone && (
              <div className="text-right">
                <a 
                  href={`tel:${company.phone ? company.phone.replace(/^\+1\s?/, '') : ''}`} 
                  className="group bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white px-6 py-4 rounded-xl transition-all font-bold flex items-center shadow-xl hover:shadow-red-500/30 transform hover:-translate-y-1 border-2 border-red-500/20"
                >
                  <div className="mr-3">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-lg font-bold">
                      {company.phone ? company.phone.replace(/^\+1\s?/, '') : ''}
                    </div>
                    <div className="text-sm opacity-90 font-medium">
                      Call Now for Service
                    </div>
                  </div>
                </a>
                <div className="mt-2 flex items-center justify-end space-x-3 text-sm">
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 font-medium">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Free Estimates
                  </span>
                  <span className="text-gray-600 font-medium">Licensed & Insured</span>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Professional Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 pt-4 border-t border-gray-200 bg-gray-50">
            <nav className="flex flex-col space-y-4">
              {['About', 'Services', 'Contact'].map((item) => (
                <Link 
                  key={item}
                  href={`#${item.toLowerCase()}`} 
                  className="text-lg text-gray-700 font-semibold transition-colors py-2 hover:text-blue-600 px-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </Link>
              ))}
            </nav>
            
            {/* Mobile professional badges */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Free Estimates
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                  Licensed & Insured
                </span>
                {(company as any).emergency_service && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-medium">
                    24/7 Emergency
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;