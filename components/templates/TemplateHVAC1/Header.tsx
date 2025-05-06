import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Company } from '@/types';

interface HeaderProps {
  company: Company;
  logoUrl: string;
}

const Header: React.FC<HeaderProps> = ({ company, logoUrl }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Image 
              src={logoUrl} 
              alt={`${company.name} logo`} 
              width={180} 
              height={60} 
              priority
            />
          </Link>
          
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          
          <nav className={`md:flex ${isMenuOpen ? 'block absolute top-20 left-0 right-0 bg-white shadow-md z-50 p-4' : 'hidden'} md:relative md:top-0 md:p-0 md:shadow-none`}>
            <ul className="flex flex-col md:flex-row md:space-x-8">
              <li className="py-2 md:py-0"><Link href="#services" className="hover:text-primary">Services</Link></li>
              <li className="py-2 md:py-0"><Link href="#about" className="hover:text-primary">About</Link></li>
              <li className="py-2 md:py-0"><Link href="#reviews" className="hover:text-primary">Reviews</Link></li>
              <li className="py-2 md:py-0"><Link href="#contact" className="hover:text-primary">Contact</Link></li>
            </ul>
          </nav>
          
          {company.phone && (
            <div className="hidden md:block">
              <Button className="bg-primary">
                Call {company.phone}
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

interface HeaderProps {
  company: Company;
  logoUrl: string | null;
}

const Header: React.FC<HeaderProps> = ({ company, logoUrl }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`${company.name} logo`}
                width={180}
                height={60}
                className="object-contain h-12 w-auto"
              />
            ) : (
              <div className="text-xl font-bold text-primary">{company.name}</div>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" passHref>
              <span className="text-gray-700 hover:text-primary font-medium">Home</span>
            </Link>
            <Link href="#about" passHref>
              <span className="text-gray-700 hover:text-primary font-medium">About</span>
            </Link>
            <Link href="#services" passHref>
              <span className="text-gray-700 hover:text-primary font-medium">Services</span>
            </Link>
            <Link href="#reviews" passHref>
              <span className="text-gray-700 hover:text-primary font-medium">Reviews</span>
            </Link>
            <Link href="#contact" passHref>
              <span className="text-gray-700 hover:text-primary font-medium">Contact</span>
            </Link>
          </nav>

          {/* Contact Info & CTA */}
          <div className="hidden md:flex items-center space-x-4">
            {company.phone && (
              <div className="text-right">
                <div className="text-xs text-gray-500">Call Us Today</div>
                <div className="font-bold text-primary">{company.phone}</div>
              </div>
            )}
            <Button className="bg-secondary hover:bg-secondary/90">Free Quote</Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-500 hover:text-gray-600"
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
              onClick={toggleMenu}
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
            <Link href="/" passHref>
              <span className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary">Home</span>
            </Link>
            <Link href="#about" passHref>
              <span className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary" onClick={toggleMenu}>About</span>
            </Link>
            <Link href="#services" passHref>
              <span className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary" onClick={toggleMenu}>Services</span>
            </Link>
            <Link href="#reviews" passHref>
              <span className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary" onClick={toggleMenu}>Reviews</span>
            </Link>
            <Link href="#contact" passHref>
              <span className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary" onClick={toggleMenu}>Contact</span>
            </Link>
            {company.phone && (
              <div className="px-3 py-2">
                <Button className="w-full" variant="outline">
                  <a href={`tel:${company.phone}`} className="block w-full">
                    Call {company.phone}
                  </a>
                </Button>
              </div>
            )}
            <div className="px-3 py-2">
              <Button className="w-full bg-secondary hover:bg-secondary/90">Free Quote</Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;