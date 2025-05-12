
import React from 'react';
import { Company } from '@/types';

interface ServicesProps {
  company: Company;
}

const Services: React.FC<ServicesProps> = ({ company }) => {
  return (
    <div className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Our Services
          </h2>
          <div className="w-16 h-1 bg-blue-600 mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {company.name} offers a comprehensive range of HVAC services to keep your home or business comfortable year-round.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Heating Service */}
          <div className="bg-gray-50 rounded-lg shadow-md p-8 transition-transform hover:scale-105">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10a1 1 0 011-1h12a1 1 0 110 2H6a1 1 0 01-1-1z M5 15a1 1 0 011-1h12a1 1 0 110 2H6a1 1 0 01-1-1z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-center mb-4">Heating Services</h3>
            <p className="text-gray-600 text-center">
              We provide installation, maintenance, and repair services for all types of heating systems, including furnaces, heat pumps, and boilers.
            </p>
          </div>
          
          {/* Cooling Service */}
          <div className="bg-gray-50 rounded-lg shadow-md p-8 transition-transform hover:scale-105">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-center mb-4">Cooling Services</h3>
            <p className="text-gray-600 text-center">
              Keep cool with our comprehensive air conditioning services, including installation, repair, and maintenance of all AC units.
            </p>
          </div>
          
          {/* Maintenance Service */}
          <div className="bg-gray-50 rounded-lg shadow-md p-8 transition-transform hover:scale-105">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-center mb-4">Maintenance Plans</h3>
            <p className="text-gray-600 text-center">
              Prevent costly breakdowns with our regular maintenance plans designed to keep your HVAC system running efficiently year-round.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;
