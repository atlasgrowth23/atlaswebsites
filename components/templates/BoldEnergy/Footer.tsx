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
              Delivering bold solutions with unmatched power and precision. 
              When you need results that matter, we bring the energy to get it done.
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
            <h4 className="text-xl font-black text-white mb-6">BOLD SERVICES</h4>
            <ul className="space-y-3 text-white/80">
              <li className="flex items-center space-x-2">
                <span className="text-yellow-400">⚡</span>
                <span>Rapid Response Solutions</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-orange-400">💪</span>
                <span>Power-Driven Results</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-red-400">🔥</span>
                <span>Bold Quality Assurance</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-yellow-400">🏆</span>
                <span>Championship Service</span>
              </li>
            </ul>
          </div>
          
          {/* Contact & Location */}
          <div>
            <h4 className="text-xl font-black text-white mb-6">GET BOLD</h4>
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
        
        {/* Bottom Bar */}
        <div className="border-t border-white/20 mt-12 pt-8 text-center">
          <p className="text-white/60">
            © 2024 {company?.name || 'Bold Energy Services'}. 
            <span className="text-yellow-400 font-bold"> BOLD RESULTS. EVERY TIME.</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;