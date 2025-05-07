// components/templates/TemplateHVAC1/Header.tsx
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Company } from '@/types';
import { getCompanyColors } from '@/lib/palettes';

interface HeaderProps {
  company: Company;
  logoUrl: string | null;
}

const Header: React.FC<HeaderProps> = ({ company, logoUrl }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Format phone number for display
  const formatPhone = (phone?: string | null) => {
    if (!phone) return '';

    // Keep only digits
    const digits = phone.replace(/\D/g, '');

    // Format as: +1 XXX-XXX-XXXX
    if (digits.length === 10) {
      return `+1 ${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
      return `+${digits[0]} ${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
    }

    return phone; // Return original if can't format
  };

  const phoneDisplay = formatPhone(company.phone);

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-200 ${isScrolled ? 'bg-white shadow-md py-2' : 'bg-white/90 py-4'}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            {logoUrl ? (
              <Link href="/" className="block">
                <Image
                  src={logoUrl}
                  alt={`${company.name} logo`}
                  width={180}
                  height={60}
                  className="h-12 w-auto object-contain"
                  priority
                />
              </Link>
            ) : (
              <Link href="/" className="block">
                <span className="text-xl font-bold text-primary">{company.name}</span>
              </Link>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-primary font-medium transition duration-150">
              Home
            </Link>
            <Link href="#about" className="text-gray-700 hover:text-primary font-medium transition duration-150">
              About
            </Link>
            <Link href="#services" className="text-gray-700 hover:text-primary font-medium transition duration-150">
              Services
            </Link>
            <Link href="#reviews" className="text-gray-700 hover:text-primary font-medium transition duration-150">
              Reviews
            </Link>
            <Link href="#contact" className="text-gray-700 hover:text-primary font-medium transition duration-150">
              Contact
            </Link>
          </nav>

          {/* Contact Info & CTA */}
          <div className="hidden lg:flex items-center space-x-4">
            {company.phone && (
              <div className="text-right">
                <div className="text-xs text-gray-500">Call Us Today</div>
                <a href={`tel:${company.phone}`} className="font-bold text-primary hover:underline">
                  {phoneDisplay}
                </a>
              </div>
            )}
            <Button className="bg-secondary text-on-secondary hover:bg-secondary/90">
              Free Quote
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              type="button"
              className="text-gray-700 hover:text-primary"
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
              onClick={toggleMenu}
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 mt-2" id="mobile-menu">
          <div className="space-y-1 px-4 py-3">
            <Link href="/" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md">
              Home
            </Link>
            <Link href="#about" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md" onClick={toggleMenu}>
              About
            </Link>
            <Link href="#services" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md" onClick={toggleMenu}>
              Services
            </Link>
            <Link href="#reviews" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md" onClick={toggleMenu}>
              Reviews
            </Link>
            <Link href="#contact" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md" onClick={toggleMenu}>
              Contact
            </Link>
            {company.phone && (
              <div className="px-3 py-2">
                <a 
                  href={`tel:${company.phone}`} 
                  className="flex items-center text-primary"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {phoneDisplay}
                </a>
              </div>
            )}
            <div className="px-3 py-2">
              <Button className="w-full bg-secondary text-on-secondary hover:bg-secondary/90">
                Free Quote
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;