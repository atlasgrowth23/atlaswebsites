import React from 'react';
import { Company } from '@/types';

interface ServicesProps {
  company: Company;
}

const Services: React.FC<ServicesProps> = ({ company }) => {
  const services = [
    {
      icon: '⚡',
      title: 'RAPID RESPONSE',
      description: 'Lightning-fast service when you need it most',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: '💪',
      title: 'BOLD SOLUTIONS',
      description: 'Powerful approaches that deliver real results',
      color: 'from-red-500 to-yellow-500'
    },
    {
      icon: '🔥',
      title: 'FIERCE QUALITY',
      description: 'Uncompromising standards in every project',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: '🏆',
      title: 'PROVEN SUCCESS',
      description: 'Track record of bold achievements',
      color: 'from-orange-600 to-red-600'
    }
  ];

  return (
    <section id="services" className="py-20 bg-gradient-to-br from-gray-900 via-orange-900 to-red-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-6">
            <span className="text-yellow-400">BOLD</span> SERVICES
          </h2>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            {company?.name || 'We'} deliver powerful solutions with unmatched intensity and commitment to excellence
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="group relative bg-gradient-to-br from-black/50 to-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border-2 border-yellow-400/30 hover:border-yellow-400 transition-all duration-300 hover:transform hover:-translate-y-2"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-10 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl`}></div>
              
              <div className="relative z-10">
                <div className="text-6xl mb-4 text-center">{service.icon}</div>
                <h3 className="text-xl font-black text-white mb-4 text-center">
                  {service.title}
                </h3>
                <p className="text-white/80 text-center leading-relaxed">
                  {service.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {company?.phone && (
          <div className="text-center mt-16">
            <a 
              href={`tel:${company.phone}`}
              className="inline-block bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-black py-4 px-8 rounded-xl text-lg transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1"
            >
              🔥 UNLEASH THE POWER: {company.phone}
            </a>
          </div>
        )}
      </div>
    </section>
  );
};

export default Services;