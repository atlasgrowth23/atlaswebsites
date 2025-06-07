
import React from 'react';
import Link from 'next/link';
import { Company } from '@/types';

interface FooterProps {
  company: Company;
}

const Footer: React.FC<FooterProps> = ({ company }) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer id="contact" className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">{company.name}</h3>
            {company.full_address && (
              <address className="not-italic mb-4 text-gray-300">
                {company.street || company.full_address}<br />
                {company.city}, {company.state} {company.postal_code}
              </address>
            )}
            {company.phone && (
              <p className="mb-2">
                <span className="font-semibold">Phone: </span>
                <a href={`tel:${company.phone}`} className="text-blue-400 hover:text-blue-300">
                  {company.phone}
                </a>
              </p>
            )}
            {company.email_1 && (
              <p>
                <span className="font-semibold">Email: </span>
                <a href={`mailto:${company.email_1}`} className="text-blue-400 hover:text-blue-300">
                  {company.email_1}
                </a>
              </p>
            )}
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#about" className="text-gray-300 hover:text-blue-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#services" className="text-gray-300 hover:text-blue-400 transition-colors">
                  Our Services
                </Link>
              </li>
              <li>
                <Link href="#contact" className="text-gray-300 hover:text-blue-400 transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Hours - From Database */}
          <div>
            <h3 className="text-xl font-bold mb-4">Business Hours</h3>
            <ul className="space-y-2 text-gray-300">
              {(company as any).hours ? (
                <>
                  <li className="flex justify-between">
                    <span>Monday - Friday:</span>
                    <span>{(company as any).hours}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Saturday:</span>
                    <span>{(company as any).saturday_hours || 'By Appointment'}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Sunday:</span>
                    <span>{(company as any).sunday_hours || 'Closed'}</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex justify-between">
                    <span>Monday - Friday:</span>
                    <span>8:00 AM - 6:00 PM</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Saturday:</span>
                    <span>9:00 AM - 3:00 PM</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Sunday:</span>
                    <span>Closed</span>
                  </li>
                </>
              )}
              {(company as any).emergency_service && (
                <li className="mt-4 pt-4 border-t border-blue-600/30">
                  <span className="font-semibold text-blue-400">24/7 Emergency Service Available</span>
                </li>
              )}
            </ul>
          </div>
        </div>
        
        {/* Social Media Links - Only show if they exist in database */}
        <div className="mt-12 pt-8 border-t border-blue-600/30">
          {((company as any).facebook || (company as any).website) && (
            <div className="flex justify-center space-x-8 mb-6">
              {/* Facebook - only if exists in database */}
              {(company as any).facebook && (
                <a 
                  href={(company as any).facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
                  aria-label="Visit our Facebook page"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}

              {/* Website - if exists */}
              {(company as any).website && (
                <a 
                  href={(company as any).website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 hover:bg-green-500 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
                  aria-label="Visit our website"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                </a>
              )}
            </div>
          )}
          
          <div className="text-center text-gray-400">
            <p>© {currentYear} {company.name}. All Rights Reserved.</p>
          </div>
        </div>
      </div>
      
    </footer>
  );
};

export default Footer;
