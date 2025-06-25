
import React from 'react';
import Link from 'next/link';
import { Company } from '@/types';

interface FooterProps {
  company: Company;
}

const Footer: React.FC<FooterProps> = ({ company }) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer id="contact" className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 text-white py-16">
      <div className="container mx-auto px-4">
        {/* Top Section with Logo/Brand */}
        <div className="text-center mb-12 pb-8 border-b border-blue-600/30">
          <div className="flex justify-center items-center mb-4">
            {company.logoUrl && (
              <img 
                src={company.logoUrl} 
                alt={`${company.name} logo`}
                className="h-12 w-auto mr-4"
              />
            )}
            <h2 className="text-3xl font-bold">{company.name}</h2>
          </div>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto">
            Your trusted partner for professional HVAC services. Licensed, insured, and committed to your comfort.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Contact Information */}
          <div className="bg-blue-800/30 p-6 rounded-xl border border-blue-600/20">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-blue-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className="text-xl font-bold text-blue-300">Contact Info</h3>
            </div>
            {company.full_address && (
              <div className="mb-4 flex items-start">
                <svg className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <address className="not-italic text-blue-100">
                  {company.street || company.full_address}<br />
                  {company.city}, {company.state} {company.postal_code}
                </address>
              </div>
            )}
            {company.phone && (
              <div className="mb-4 flex items-center">
                <svg className="w-5 h-5 text-blue-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href={`tel:${company.phone}`} className="text-blue-300 hover:text-white transition-colors font-semibold">
                  {company.phone}
                </a>
              </div>
            )}
            {company.email_1 && (
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href={`mailto:${company.email_1}`} className="text-blue-300 hover:text-white transition-colors">
                  {company.email_1}
                </a>
              </div>
            )}
          </div>
          
          {/* Quick Links */}
          <div className="bg-blue-800/30 p-6 rounded-xl border border-blue-600/20">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-blue-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <h3 className="text-xl font-bold text-blue-300">Quick Links</h3>
            </div>
            <ul className="space-y-3">
              <li>
                <Link href="#about" className="text-blue-100 hover:text-white transition-colors flex items-center group">
                  <svg className="w-4 h-4 mr-2 text-blue-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#services" className="text-blue-100 hover:text-white transition-colors flex items-center group">
                  <svg className="w-4 h-4 mr-2 text-blue-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Our Services
                </Link>
              </li>
              <li>
                <Link href="#contact" className="text-blue-100 hover:text-white transition-colors flex items-center group">
                  <svg className="w-4 h-4 mr-2 text-blue-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Contact Us
                </Link>
              </li>
              <li className="pt-2 border-t border-blue-600/30">
                <a href={`tel:${company.phone}`} className="text-blue-300 hover:text-white transition-colors flex items-center group font-semibold">
                  <svg className="w-4 h-4 mr-2 text-blue-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call Now
                </a>
              </li>
            </ul>
          </div>
          
          {/* Business Hours */}
          <div className="bg-blue-800/30 p-6 rounded-xl border border-blue-600/20">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-blue-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-bold text-blue-300">Business Hours</h3>
            </div>
            <ul className="space-y-3 text-blue-100">
              {(company as any).hours ? (
                <>
                  <li className="flex justify-between items-center py-2 px-3 bg-blue-700/20 rounded-lg">
                    <span className="font-medium">Monday - Friday:</span>
                    <span className="text-blue-300">{(company as any).hours}</span>
                  </li>
                  <li className="flex justify-between items-center py-2 px-3 bg-blue-700/20 rounded-lg">
                    <span className="font-medium">Saturday:</span>
                    <span className="text-blue-300">{(company as any).saturday_hours || 'By Appointment'}</span>
                  </li>
                  <li className="flex justify-between items-center py-2 px-3 bg-blue-700/20 rounded-lg">
                    <span className="font-medium">Sunday:</span>
                    <span className="text-blue-300">{(company as any).sunday_hours || 'Closed'}</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex justify-between items-center py-2 px-3 bg-blue-700/20 rounded-lg">
                    <span className="font-medium">Monday - Friday:</span>
                    <span className="text-blue-300">8:00 AM - 6:00 PM</span>
                  </li>
                  <li className="flex justify-between items-center py-2 px-3 bg-blue-700/20 rounded-lg">
                    <span className="font-medium">Saturday:</span>
                    <span className="text-blue-300">9:00 AM - 3:00 PM</span>
                  </li>
                  <li className="flex justify-between items-center py-2 px-3 bg-blue-700/20 rounded-lg">
                    <span className="font-medium">Sunday:</span>
                    <span className="text-blue-300">Closed</span>
                  </li>
                </>
              )}
              {(company as any).emergency_service && (
                <li className="mt-4 pt-4 border-t border-blue-600/30">
                  <div className="flex items-center p-3 bg-red-600/20 border border-red-500/30 rounded-lg">
                    <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold text-red-400">24/7 Emergency Service Available</span>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>
        
        {/* Social Media Links & Final Section */}
        <div className="pt-8 border-t border-blue-600/30">
          {((company as any).facebook || (company as any).website) && (
            <div className="flex justify-center space-x-6 mb-8">
              {/* Facebook - only if exists in database */}
              {(company as any).facebook && (
                <a 
                  href={(company as any).facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl group"
                  aria-label="Visit our Facebook page"
                >
                  <div className="flex items-center">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span className="ml-2 font-medium hidden sm:block">Facebook</span>
                  </div>
                </a>
              )}

              {/* Website - if exists */}
              {(company as any).website && (
                <a 
                  href={(company as any).website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 hover:bg-green-500 text-white p-4 rounded-xl transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl group"
                  aria-label="Visit our website"
                >
                  <div className="flex items-center">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                    <span className="ml-2 font-medium hidden sm:block">Website</span>
                  </div>
                </a>
              )}
              
              {/* Direct Call Button */}
              <a 
                href={`tel:${company.phone}`}
                className="bg-red-600 hover:bg-red-500 text-white p-4 rounded-xl transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl group"
                aria-label="Call us now"
              >
                <div className="flex items-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="ml-2 font-medium hidden sm:block">Call Now</span>
                </div>
              </a>
            </div>
          )}
          
          <div className="text-center">
            <div className="bg-blue-800/20 rounded-xl p-6 border border-blue-600/20">
              <p className="text-blue-200 text-lg mb-2">© {currentYear} {company.name}. All Rights Reserved.</p>
              <p className="text-blue-300 text-sm">
                Licensed • Insured • Professional HVAC Services
              </p>
            </div>
          </div>
        </div>
      </div>
      
    </footer>
  );
};

export default Footer;
