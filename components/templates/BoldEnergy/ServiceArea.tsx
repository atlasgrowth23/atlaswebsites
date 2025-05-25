import React from 'react';
import { Company } from '@/types';

interface ServiceAreaProps {
  company: Company;
}

const ServiceArea: React.FC<ServiceAreaProps> = ({ company }) => {
  return (
    <section id="service-area" className="py-20 bg-gradient-to-br from-orange-100 via-red-50 to-yellow-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6">
            <span className="text-orange-600">LOCAL</span> SERVICE AREA
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Bringing professional solutions to {company?.city || 'your area'} and surrounding communities
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="bg-gradient-to-br from-orange-200 to-red-200 p-8 rounded-2xl border-2 border-orange-300">
              <h3 className="text-2xl font-black text-gray-900 mb-6">
                🗺️ COVERAGE AREAS
              </h3>
              
              <div className="space-y-4">
                {company?.city && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-lg font-bold text-gray-800">
                      {company.city}, {company?.state || 'Local Area'}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-lg font-bold text-gray-800">
                    Surrounding Communities
                  </span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-lg font-bold text-gray-800">
                    Emergency Service Available
                  </span>
                </div>
              </div>
              
              {company?.phone && (
                <div className="mt-8">
                  <a 
                    href={`tel:${company.phone}`}
                    className="block w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-black py-4 px-6 rounded-lg text-center text-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
                  >
                    🔥 CALL FOR EXPERT SERVICE: {company.phone}
                  </a>
                </div>
              )}
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border-2 border-yellow-400">
              <h3 className="text-2xl font-black text-white mb-6">
                ⚡ RAPID RESPONSE ZONES
              </h3>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-4 rounded-lg border border-orange-400/30">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold">Same Day Service</span>
                    <span className="text-yellow-400 font-black">⚡ FAST</span>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-red-500/20 to-yellow-500/20 p-4 rounded-lg border border-red-400/30">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold">24/7 Emergency</span>
                    <span className="text-yellow-400 font-black">🔥 READY</span>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 p-4 rounded-lg border border-yellow-400/30">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold">Weekend Service</span>
                    <span className="text-yellow-400 font-black">💪 RELIABLE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServiceArea;