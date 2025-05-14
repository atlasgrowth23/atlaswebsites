import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Company } from '@/types';
import { Phone, Calendar, MessageCircle, Menu, X } from 'lucide-react';

interface HeaderProps {
  company: Company;
}

const Header: React.FC<HeaderProps> = ({ company }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);

  // Using standardized design tokens instead of hardcoded colors

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleChatClick = () => {
    setShowChatPopup(true);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would handle the contact form submission
    alert('Contact form submitted - this would connect to your backend');
    setShowChatPopup(false);
  };

  return (
    <>
      <header 
        className={`fixed w-full z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white shadow-md py-2' 
            : 'bg-white/90 backdrop-blur-sm py-4'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            {/* Logo & Company Name */}
            <div className="flex items-center">
              {company.logo ? (
                <Image 
                  src={company.logo} 
                  alt={company.name || 'Company logo'} 
                  width={40} 
                  height={40} 
                  className="mr-3"
                />
              ) : (
                <div 
                  className="w-10 h-10 rounded-md flex items-center justify-center mr-3 text-white font-bold bg-primary"
                >
                  {company.name?.charAt(0) || 'H'}
                </div>
              )}
              <div>
                <h1 className="font-bold text-xl text-primary">
                  {company.name || 'HVAC Company'}
                </h1>
                <p className="text-xs text-gray-500 -mt-1 hidden sm:block">
                  {company.city ? `Serving ${company.city} & Surrounding Areas` : 'Professional HVAC Services'}
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#services" className="text-gray-700 hover:text-blue-600 font-medium">
                Services
              </Link>
              <Link href="#about" className="text-gray-700 hover:text-blue-600 font-medium">
                About
              </Link>
              <Link href="#testimonials" className="text-gray-700 hover:text-blue-600 font-medium">
                Testimonials
              </Link>
              <Link href="#contact" className="text-gray-700 hover:text-blue-600 font-medium">
                Contact
              </Link>
            </nav>

            {/* Action Buttons */}
            <div className="hidden lg:flex items-center space-x-3">
              {company.phone && (
                <a 
                  href={`tel:${company.phone}`}
                  className="flex items-center px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/10 transition-colors font-medium"
                >
                  <Phone size={16} className="mr-2" />
                  {company.phone}
                </a>
              )}
              
              <button
                onClick={handleChatClick}
                className="flex items-center px-4 py-2 bg-primary text-white rounded-md shadow-sm hover:bg-primary/90 hover:shadow-md transition-all"
              >
                <MessageCircle size={16} className="mr-2" />
                Quick Chat
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              {company.phone && (
                <a 
                  href={`tel:${company.phone}`}
                  className="mr-2 p-2 rounded-full text-primary"
                  aria-label="Call us"
                >
                  <Phone size={20} />
                </a>
              )}
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-gray-700"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-3 pt-3 border-t border-gray-100">
              <nav className="flex flex-col space-y-3 pb-3">
                <Link 
                  href="#services" 
                  className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Services
                </Link>
                <Link 
                  href="#about" 
                  className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </Link>
                <Link 
                  href="#testimonials" 
                  className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Testimonials
                </Link>
                <Link 
                  href="#contact" 
                  className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleChatClick();
                  }}
                  className="flex items-center justify-center w-full px-4 py-2 mt-2 text-white bg-primary rounded-md"
                >
                  <MessageCircle size={16} className="mr-2" />
                  Quick Chat
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Mini Chat Widget - instead of the large full-screen widget */}
      {showChatPopup && (
        <div className="fixed bottom-4 right-4 z-50 w-80 md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          <div 
            className="px-4 py-3 flex items-center justify-between bg-primary"
          >
            <h3 className="text-white font-medium flex items-center">
              <MessageCircle size={18} className="mr-2" />
              Chat with Us
            </h3>
            <button 
              onClick={() => setShowChatPopup(false)}
              className="text-white/80 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-4">
              How can we help you today? Fill out this quick form and we'll get back to you shortly.
            </p>
            
            <form onSubmit={handleContactSubmit} className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Your Name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Your Email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <input
                  type="tel"
                  placeholder="Your Phone (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <textarea
                  placeholder="How can we help you?"
                  rows={3}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                ></textarea>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 text-white font-medium rounded-md bg-primary"
                >
                  Send Message
                </button>
                <button
                  type="button"
                  onClick={() => setShowChatPopup(false)}
                  className="py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;