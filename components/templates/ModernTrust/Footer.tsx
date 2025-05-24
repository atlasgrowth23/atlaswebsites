
import React from 'react';
import Link from 'next/link';
import { Company } from '@/types';

interface FooterProps {
  company: Company;
}

const Footer: React.FC<FooterProps> = ({ company }) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer id="contact" className="bg-gray-900 text-white py-12">
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
                <Link href="#" className="text-gray-300 hover:text-blue-400 transition-colors">
                  Financing Options
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-blue-400 transition-colors">
                  Service Areas
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Hours */}
          <div>
            <h3 className="text-xl font-bold mb-4">Business Hours</h3>
            <ul className="space-y-2 text-gray-300">
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
              <li className="mt-4 pt-4 border-t border-gray-700">
                <span className="font-semibold text-blue-400">24/7 Emergency Service Available</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
          <p>© {currentYear} {company.name}. All Rights Reserved.</p>
        </div>
      </div>
      
      {/* Chat Widget Script */}
      <script 
        src="https://widgets.leadconnectorhq.com/loader.js"  
        data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js" 
        data-widget-id="68311816e4bd84135d2b46e2"   
      />
    </footer>
  );
};

export default Footer;
