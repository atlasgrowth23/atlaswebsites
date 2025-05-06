import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Company } from '@/types';

interface ServicesProps {
  company: Company;
}

const defaultServices = [
  {
    title: 'HVAC Installation',
    description: 'Professional installation of heating, ventilation, and air conditioning systems for residential and commercial properties.',
    icon: '❄️'
  },
  {
    title: 'AC Repair & Maintenance',
    description: 'Expert repair services and regular maintenance to keep your cooling systems running efficiently all summer long.',
    icon: '🔧'
  },
  {
    title: 'Heating Services',
    description: 'Furnace installation, repair, and maintenance to ensure reliable heating during cold weather months.',
    icon: '🔥'
  },
  {
    title: 'Air Quality Solutions',
    description: 'Improve indoor air quality with our professional ventilation, filtration, and purification services.',
    icon: '💨'
  },
  {
    title: 'Commercial HVAC',
    description: 'Specialized HVAC solutions for businesses, offices, retail spaces, and industrial facilities.',
    icon: '🏢'
  },
  {
    title: 'Emergency Service',
    description: '24/7 emergency HVAC services when you need immediate assistance with your heating or cooling systems.',
    icon: '🚨'
  }
];

const Services: React.FC<ServicesProps> = ({ company }) => {
  // Since we don't have services in the new database schema, we'll use the default services
  const displayServices = defaultServices;

  return (
    <section className="py-16 bg-gray-50" id="services">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Our HVAC Services</h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            {company.name} offers comprehensive heating, ventilation, and air conditioning services 
            to keep your home or business comfortable year-round.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayServices.map((service, index) => (
            <Card key={index} className="service-card border-t-4 border-t-primary hover:border-t-secondary">
              <CardHeader>
                <div className="text-3xl mb-4">{service.icon}</div>
                <CardTitle>{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;