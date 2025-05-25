import React, { useState, useEffect, useRef } from 'react';
import { Company } from '@/types';

interface ServicesProps {
  company: Company;
}

// Service data for both types
const coolingServices = [
  {
    title: "AC Installation",
    description: "Professional installation of energy-efficient air conditioning systems for your home.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    )
  },
  {
    title: "AC Repair",
    description: "Quick diagnostic and repair services to get your cooling system back up and running.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
  {
    title: "Maintenance & Tune-ups",
    description: "Regular maintenance to keep your AC running efficiently and prevent costly breakdowns.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
      </svg>
    )
  }
];

const heatingServices = [
  {
    title: "Furnace Installation",
    description: "Expert installation of high-efficiency furnaces and heating systems for your home.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    )
  },
  {
    title: "Heating Repair",
    description: "Fast, reliable repairs for all types of heating systems to restore comfort to your home.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  {
    title: "Winter Maintenance",
    description: "Seasonal tune-ups to ensure your heating system is ready for the cold winter months.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10a1 1 0 011-1h12a1 1 0 110 2H6a1 1 0 01-1-1z M5 15a1 1 0 011-1h12a1 1 0 110 2H6a1 1 0 01-1-1z" />
      </svg>
    )
  }
];

const Services: React.FC<ServicesProps> = ({ company }) => {
  // State for active service type
  const [activeType, setActiveType] = useState<'cooling' | 'heating'>('cooling');
  
  // Determine which services to display
  const services = activeType === 'cooling' ? coolingServices : heatingServices;
  
  // Determine colors based on active type - using orange/red/yellow theme
  const activeColors = {
    bg: activeType === 'cooling' ? 'bg-orange-600' : 'bg-red-700',
    text: activeType === 'cooling' ? 'text-orange-600' : 'text-red-700',
    bgLight: activeType === 'cooling' ? 'bg-orange-100' : 'bg-red-100',
    hover: activeType === 'cooling' ? 'hover:bg-orange-700' : 'hover:bg-red-800',
    border: activeType === 'cooling' ? 'border-orange-200' : 'border-red-200'
  };

  // Handle toggle between cooling and heating
  const handleToggle = (type: 'cooling' | 'heating') => {
    setActiveType(type);
  };

  return (
    <div id="services" className="py-20">
      {/* Hero intro that's visible above the fold */}
      <div className={`${activeType === 'cooling' ? 'bg-orange-600' : 'bg-red-700'} transition-colors duration-500 mb-16`}>
        <div className="container mx-auto px-4">
          <div className="py-16 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white opacity-5 -mt-32 -mr-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white opacity-5 -mb-24 -ml-24"></div>
            
            <div className="text-center relative z-10">
              <h2 className="text-4xl lg:text-5xl font-black text-white mb-6">
                Our {activeType === 'cooling' ? 'Cooling' : 'Heating'} Services
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
                {company?.name || 'We'} provide professional {activeType} solutions to keep your home comfortable year-round
              </p>
              
              {/* Toggle buttons */}
              {/* Service toggle - larger and more prominent */}
              <div className="flex justify-center mt-8">
                <div className="bg-white bg-opacity-15 backdrop-blur-sm p-2 rounded-xl shadow-xl inline-flex gap-2">
                  <button 
                    onClick={() => handleToggle('cooling')} 
                    className={`px-8 py-4 rounded-lg font-bold text-xl transition-all duration-300 flex items-center transform hover:scale-105 ${
                      activeType === 'cooling' 
                        ? 'bg-white text-orange-600 shadow-lg scale-105' 
                        : 'bg-orange-600 bg-opacity-80 text-white hover:bg-opacity-90'
                    }`}
                  >
                    <svg className="w-7 h-7 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                    </svg>
                    Cooling
                  </button>
                  <button 
                    onClick={() => handleToggle('heating')} 
                    className={`px-8 py-4 rounded-lg font-bold text-xl transition-all duration-300 flex items-center transform hover:scale-105 ${
                      activeType === 'heating' 
                        ? 'bg-white text-red-700 shadow-lg scale-105' 
                        : 'bg-red-600 bg-opacity-80 text-white hover:bg-opacity-90'
                    }`}
                  >
                    <svg className="w-7 h-7 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                    Heating
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services grid */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {services.map((service, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${activeColors.border} border-2`}
            >
              <div className={`${activeColors.bgLight} rounded-xl p-4 w-fit mb-6 transition-colors duration-300`}>
                <div className={`${activeColors.text} transition-colors duration-300`}>
                  {service.icon}
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {service.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed mb-6">
                {service.description}
              </p>
              
              <button className={`${activeColors.bg} ${activeColors.hover} text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:shadow-lg`}>
                Learn More
              </button>
            </div>
          ))}
        </div>

        {/* CTA */}
        {company?.phone && (
          <div className="text-center">
            <a 
              href={`tel:${company.phone}`}
              className="inline-block bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-black py-4 px-8 rounded-xl text-lg transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1"
            >
              📞 Call {company.phone}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Services;