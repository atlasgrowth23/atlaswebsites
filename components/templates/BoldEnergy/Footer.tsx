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
          <div className="flex justify-center space-x-6 mb-6">
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

            {/* Instagram */}
            <a 
              href={`https://www.instagram.com/explore/tags/${encodeURIComponent(company.name.replace(/\s+/g, '').toLowerCase())}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-br from-red-600 to-yellow-600 hover:from-red-700 hover:to-yellow-700 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
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
                <path d="M21.111 18.226c-.141.969-2.119 3.708-3.035 3.75-.915.042-.969-.583-1.242-1.297-.273-.714-1.235-4.373-1.235-4.373-.051-.543.249-.969.6-1.144.35-.175 3.543-.175 3.543-.175.969.051 1.409.267 1.369 1.239zM11.73 14.194l-2.95-1.292c-.601-.263-1.226-.194-1.435.159-.209.354-.194 1.226.604 1.489l2.95 1.292c.797.354 1.435-.159 1.645-.513.209-.354.987-1.135-.814-1.135zM9.152 9.056l-3.603-.648c-.648-.115-1.292.115-1.379.648-.086.533.086 1.063.734 1.178l3.603.648c.648.115 1.292-.115 1.379-.648.086-.533-.086-1.063-.734-1.178zM21.152 10.646c.051-.969-.4-1.185-1.369-1.236 0 0-3.193 0-3.543.175-.351.175-.651.601-.6 1.144 0 0 .962 3.659 1.235 4.373.273.714.327 1.339 1.242 1.297.916-.042 2.894-2.781 3.035-3.75zM9.152 14.944l-3.603.648c-.648.115-.82.645-.734 1.178.087.533.731.763 1.379.648l3.603-.648c.648-.115.82-.645.734-1.178-.087-.533-.731-.763-1.379-.648z"/>
              </svg>
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