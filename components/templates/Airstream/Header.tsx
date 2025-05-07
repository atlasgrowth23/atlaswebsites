import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Phone, Menu, X } from 'lucide-react';
import { Company } from '@/types';
import { getCompanyColors } from '@/lib/palettes';
import { hexToHsl } from '@/lib/utils';

interface HeaderProps {
  company?: Company;
}

const Header: React.FC<HeaderProps> = ({ company }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get company colors with fallbacks
  const colors = getCompanyColors(company);

  // Convert hex to HSL for CSS variables
  const primaryHsl = hexToHsl(colors.primary);
  const secondaryHsl = hexToHsl(colors.secondary);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Navigation items
  const navItems = [
    { title: 'Services', href: '#services' },
    { title: 'About', href: '#about' },
    { title: 'Reviews', href: '#reviews' },
    { title: 'Contact', href: '#contact' }
  ];

  return (
    <header 
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-md py-3" : "bg-transparent py-5"
      }`}
      style={{
        // Set CSS variables for theming
        '--primary': primaryHsl,
        '--secondary': secondaryHsl
      } as React.CSSProperties}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            {company?.logo ? (
              <Image 
                src={company.logo} 
                alt={`${company.name} logo`}
                width={150}
                height={50}
                className="h-12 w-auto object-contain"
              />
            ) : (
              <div className={`text-xl font-bold ${scrolled ? 'text-primary' : 'text-white'}`}>
                {company?.name || 'HVAC Company'}
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link 
                key={item.title}
                href={item.href}
                className={`relative group ${
                  scrolled ? 'text-gray-800' : 'text-white'
                }`}
              >
                {item.title}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-secondary transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </nav>

          {/* Phone CTA */}
          <div className="hidden md:flex items-center">
            {company?.phone && (
              <Button 
                variant="outline" 
                className={`flex items-center space-x-2 ${
                  scrolled ? 'border-primary text-primary' : 'border-white text-white'
                }`}
              >
                <span className="animate-pulse">
                  <Phone size={18} />
                </span>
                <a href={`tel:${company.phone}`} className="font-medium">
                  {company.phone}
                </a>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 ${scrolled ? 'text-gray-800' : 'text-white'}`}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 py-4 bg-white rounded-lg shadow-lg animate-fade-down">
            <nav className="flex flex-col space-y-4 px-4">
              {navItems.map((item) => (
                <Link 
                  key={item.title}
                  href={item.href}
                  className="text-gray-800 py-2 hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.title}
                </Link>
              ))}

              {company?.phone && (
                <a 
                  href={`tel:${company.phone}`}
                  className="flex items-center space-x-2 text-primary py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Phone size={18} />
                  <span>{company.phone}</span>
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