import React from 'react';
import { Company } from '@/types';

interface FooterProps {
  company: Company;
}

const Footer: React.FC<FooterProps> = ({ company }) => {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-orange-900 to-black py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Company Info */}
          <div>
            <h3 className="text-2xl font-black text-white mb-6">
              <span className="text-yellow-400">{company?.name || 'BOLD'}</span>
            </h3>
            <p className="text-white/80 mb-6 leading-relaxed">
              Delivering professional solutions with expertise and precision. 
              When you need results that matter, we bring the experience to get it done right.
            </p>
            
            {company?.phone && (
              <a 
                href={`tel:${company.phone}`}
                className="inline-block bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-black py-3 px-6 rounded-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
              >
                🔥 {company.phone}
              </a>
            )}
          </div>
          
          {/* Services */}
          <div>
            <h4 className="text-xl font-black text-white mb-6">PROFESSIONAL SERVICES</h4>
            <ul className="space-y-3 text-white/80">
              <li className="flex items-center space-x-2">
                <span className="text-yellow-400">⚡</span>
                <span>Rapid Response Solutions</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-orange-400">💪</span>
                <span>Expert-Driven Results</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-red-400">🔥</span>
                <span>Premium Quality Assurance</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-yellow-400">🏆</span>
                <span>Award-Winning Service</span>
              </li>
            </ul>
          </div>
          
          {/* Contact & Location */}
          <div>
            <h4 className="text-xl font-black text-white mb-6">GET SERVICE</h4>
            <div className="space-y-4 text-white/80">
              {company?.city && (
                <div className="flex items-center space-x-2">
                  <span className="text-orange-400">📍</span>
                  <span>Serving {company.city}, {company?.state || 'Local Area'}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <span className="text-yellow-400">⏰</span>
                <span>24/7 Emergency Service</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-red-400">✅</span>
                <span>100% Satisfaction Guaranteed</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Social Media Links */}
        <div className="mt-12 pt-8 border-t border-white/20">
          <div className="flex justify-center space-x-8 mb-6">
            {/* Facebook */}
            <a 
              href={`https://www.facebook.com/search/top?q=${encodeURIComponent(company.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
              aria-label="Visit our Facebook page"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>

            {/* Yelp */}
            <a 
              href={`https://www.yelp.com/search?find_desc=${encodeURIComponent(company.name)}&find_loc=${encodeURIComponent((company.city || '') + ', ' + (company.state || ''))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-red-600 hover:bg-red-700 text-white w-12 h-12 rounded-full transition-all duration-300 hover:scale-110 shadow-lg flex items-center justify-center"
              aria-label="Visit our Yelp page"
            >
              <span className="text-xs font-bold">Yelp</span>
            </a>
          </div>
          
          <div className="text-center">
            <p className="text-white/60">
              © 2024 {company?.name || 'Professional Services'}. 
              <span className="text-yellow-400 font-bold"> QUALITY RESULTS. EVERY TIME.</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;