import React, { useState, useEffect, useRef } from 'react';
import { Company } from '@/types';

interface ServicesProps {
  company: Company;
}

// Service data for both types
const coolingServices = [
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
  },
  {
    title: "AC Installation",
    description: "Professional installation of energy-efficient air conditioning systems for your home.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    )
  }
];

const heatingServices = [
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
  },
  {
    title: "Furnace Installation",
    description: "Expert installation of high-efficiency furnaces and heating systems for your home.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    )
  }
];

const Services: React.FC<ServicesProps> = ({ company }) => {
  // State for active service type
  const [activeType, setActiveType] = useState<'cooling' | 'heating'>('cooling');
  
  // Determine which services to display
  const services = activeType === 'cooling' ? coolingServices : heatingServices;
  
  // Determine colors based on active type - green for cooling, red for heating
  const activeColors = {
    bg: activeType === 'cooling' ? 'bg-green-600' : 'bg-red-600',
    text: activeType === 'cooling' ? 'text-green-600' : 'text-red-600',
    bgLight: activeType === 'cooling' ? 'bg-green-100' : 'bg-red-100',
    hover: activeType === 'cooling' ? 'hover:bg-green-700' : 'hover:bg-red-700',
    border: activeType === 'cooling' ? 'border-green-200' : 'border-red-200'
  };

  // Handle toggle between cooling and heating
  const handleToggle = (type: 'cooling' | 'heating') => {
    setActiveType(type);
  };

  return (
    <div id="services" className="py-20">
      {/* Hero intro that's visible above the fold */}
      <div className={`${activeType === 'cooling' ? 'bg-green-600' : 'bg-red-600'} transition-colors duration-500 mb-16`}>
        <div className="container mx-auto px-4">
          <div className="py-16 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white opacity-5 -mt-32 -mr-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white opacity-5 -mb-24 -ml-24"></div>
            
            {/* Icon for service type */}
            <div className="absolute right-10 top-10 hidden lg:block">
              <div className="relative w-32 h-32">
                {activeType === 'cooling' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-white opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-white opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                )}
              </div>
            </div>
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 text-center md:text-left">
                {company.name} <br/>
                <span className="inline-block mt-2">
                  {activeType === 'cooling' ? 'Cooling' : 'Heating'} Services
                </span>
              </h2>
              
              <p className="text-xl text-white text-opacity-90 max-w-2xl mb-10 text-center md:text-left">
                {activeType === 'cooling'
                  ? `Expert air conditioning solutions to keep your family comfortable during the hottest summer days, while maximizing energy efficiency.`
                  : `Reliable heating services to ensure your home stays warm and cozy throughout the cold winter months.`
                }
              </p>
              
              {/* Service toggle - modern slider style */}
              <div className="flex justify-center mt-8">
                <div className="bg-white bg-opacity-20 backdrop-blur-sm p-3 rounded-2xl shadow-xl">
                  <div className="relative flex bg-gray-100 rounded-xl p-1">
                    {/* Sliding background indicator */}
                    <div 
                      className={`absolute top-1 bottom-1 rounded-lg transition-all duration-300 shadow-lg ${
                        activeType === 'cooling' 
                          ? 'left-1 bg-green-600' 
                          : 'right-1 bg-red-600'
                      }`}
                      style={{ width: 'calc(50% - 4px)' }}
                    />
                    
                    {/* Cooling button */}
                    <button 
                      onClick={() => handleToggle('cooling')} 
                      className={`relative z-10 px-8 py-4 rounded-lg font-bold text-xl transition-all duration-300 flex items-center flex-1 justify-center ${
                        activeType === 'cooling' 
                          ? 'text-white' 
                          : 'text-green-600 hover:text-green-700'
                      }`}
                    >
                      <svg className="w-6 h-6 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                      </svg>
                      Cooling
                    </button>
                    
                    {/* Heating button */}
                    <button 
                      onClick={() => handleToggle('heating')} 
                      className={`relative z-10 px-8 py-4 rounded-lg font-bold text-xl transition-all duration-300 flex items-center flex-1 justify-center ${
                        activeType === 'heating' 
                          ? 'text-white' 
                          : 'text-red-600 hover:text-red-700'
                      }`}
                    >
                      <svg className="w-6 h-6 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      </div>
      
      {/* Main content */}
      <div className="container mx-auto px-4">
        {/* Service cards - simple with no complex animations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {services.map((service, index) => (
            <div 
              key={service.title}
              className={`bg-white rounded-xl shadow-lg p-8 border ${activeColors.border} 
                transition-all duration-300 hover:shadow-xl group`}
            >
              <div className={`w-16 h-16 ${activeColors.bgLight} rounded-xl flex items-center justify-center mb-6 mx-auto 
                transition-colors duration-300 group-hover:scale-110 transform`}>
                <div className={activeColors.text}>
                  {service.icon}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-center mb-4 text-gray-800">{service.title}</h3>
              <p className="text-gray-600 text-center text-lg">
                {service.description}
              </p>
              
              {/* Action button */}
              <div className="mt-8 text-center">
                <button className={`${activeColors.text} font-semibold flex items-center mx-auto`}>
                  Learn More
                  <svg className="w-5 h-5 ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Services;