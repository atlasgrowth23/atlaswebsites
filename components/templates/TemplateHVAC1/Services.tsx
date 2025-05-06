import React from 'react';
import { Button } from '@/components/ui/button';
import { Company } from '@/types';
import Link from 'next/link';

interface ServicesProps {
  company: Company;
}

const heatingServices = [
  'Furnace Installation & Replacement',
  'Heating System Repair',
  'Furnace Tune-Ups',
  'Heat Pump Services',
  'Gas Heating',
  'Electric Heating Options'
];

const coolingServices = [
  'AC Installation & Replacement',
  'Air Conditioner Repair',
  'Preventative Maintenance',
  'Ductless Mini-Split Systems',
  'Thermostat Installation',
  'Emergency AC Service'
];

const Services: React.FC<ServicesProps> = ({ company }) => {
  return (
    <section className="py-16" id="services">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Our HVAC Services</h2>
          <p className="text-gray-600 max-w-3xl mx-auto text-lg">
            {company.name} offers complete heating and cooling solutions to keep your home or business comfortable all year round.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 mt-8">
          {/* Heating Services - Red Side */}
          <div className="flex-1 bg-gradient-to-br from-red-600 to-red-700 text-white rounded-xl shadow-xl overflow-hidden transition-transform hover:scale-105">
            <div className="p-8 flex flex-col h-full">
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">🔥</div>
                <h3 className="text-2xl md:text-3xl font-bold">Heating Services</h3>
                <p className="mt-2 opacity-90">Stay warm during the coldest months</p>
              </div>
              
              <ul className="space-y-3 mb-8 flex-grow">
                {heatingServices.map((service, index) => (
                  <li key={index} className="flex items-center">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    {service}
                  </li>
                ))}
              </ul>
              
              <Button className="w-full bg-white text-red-700 hover:bg-red-100 hover:text-red-800 font-semibold py-4 rounded-lg shadow transition-all">
                <Link href="#contact" className="w-full block">Learn More About Heating</Link>
              </Button>
            </div>
          </div>
          
          {/* Cooling Services - Blue Side */}
          <div className="flex-1 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-xl overflow-hidden transition-transform hover:scale-105">
            <div className="p-8 flex flex-col h-full">
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">❄️</div>
                <h3 className="text-2xl md:text-3xl font-bold">Cooling Services</h3>
                <p className="mt-2 opacity-90">Stay cool during the summer heat</p>
              </div>
              
              <ul className="space-y-3 mb-8 flex-grow">
                {coolingServices.map((service, index) => (
                  <li key={index} className="flex items-center">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    {service}
                  </li>
                ))}
              </ul>
              
              <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-semibold py-4 rounded-lg shadow transition-all">
                <Link href="#contact" className="w-full block">Learn More About Cooling</Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Emergency Service Banner */}
        <div className="mt-12 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-yellow-800">24/7 Emergency HVAC Service Available</h3>
              <p className="text-yellow-700">
                Heating or cooling emergency? Call us anytime at {company.phone || "our emergency line"}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;