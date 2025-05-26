
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
        
        {/* Social Media Links */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex justify-center space-x-6 mb-6">
            {/* Facebook */}
            <a 
              href={`https://www.facebook.com/search/top?q=${encodeURIComponent(company.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
              aria-label="Visit our Facebook page"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>

            {/* Instagram */}
            <a 
              href={`https://www.instagram.com/explore/tags/${encodeURIComponent(company.name.replace(/\s+/g, '').toLowerCase())}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
              aria-label="Visit our Instagram page"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.621 5.367 11.988 11.988 11.988s11.988-5.367 11.988-11.988C24.005 5.367 18.638.001 12.017.001zM8.449 20.312c-2.214 0-4.006-1.792-4.006-4.006V7.694c0-2.214 1.792-4.006 4.006-4.006h7.102c2.214 0 4.006 1.792 4.006 4.006v8.612c0 2.214-1.792 4.006-4.006 4.006H8.449zM12 6.865c-2.84 0-5.135 2.295-5.135 5.135S9.16 17.135 12 17.135s5.135-2.295 5.135-5.135S14.84 6.865 12 6.865zm0 8.468c-1.84 0-3.333-1.493-3.333-3.333S10.16 8.667 12 8.667s3.333 1.493 3.333 3.333S13.84 15.333 12 15.333zm5.338-9.87c-.665 0-1.204-.539-1.204-1.204s.539-1.204 1.204-1.204 1.204.539 1.204 1.204-.539 1.204-1.204 1.204z"/>
              </svg>
            </a>

            {/* Yelp */}
            <a 
              href={`https://www.yelp.com/search?find_desc=${encodeURIComponent(company.name)}&find_loc=${encodeURIComponent((company.city || '') + ', ' + (company.state || ''))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
              aria-label="Visit our Yelp page"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.271 16.718v1.417q-.011.196-.115.322-.104.126-.322.126-.196 0-.322-.126-.126-.126-.126-.322v-1.417q-.816-.063-1.417-.411-.196-.126-.196-.322 0-.126.063-.196l.693-.693q.126-.126.322-.126.196 0 .322.126l.693.693q.063.070.063.196 0 .196-.196.322-.601.348-1.417.411zm5.213-6.677q.196 0 .322.126.126.126.126.322v.553q0 .196-.126.322-.126.126-.322.126h-1.167q-.196 0-.322-.126-.126-.126-.126-.322v-.553q0-.196.126-.322.126-.126.322-.126h1.167zm-10.68 0q.196 0 .322.126.126.126.126.322v.553q0 .196-.126.322-.126.126-.322.126H5.637q-.196 0-.322-.126-.126-.126-.126-.322v-.553q0-.196.126-.322.126-.126.322-.126h1.167z"/>
              </svg>
            </a>
          </div>
          
          <div className="text-center text-gray-400">
            <p>© {currentYear} {company.name}. All Rights Reserved.</p>
          </div>
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
