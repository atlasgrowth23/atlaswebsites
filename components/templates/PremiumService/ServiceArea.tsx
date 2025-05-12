
import React from 'react';
import { Company } from '@/types';

interface ServiceAreaProps {
  company: Company;
}

const ServiceArea: React.FC<ServiceAreaProps> = ({ company }) => {
  // Sample locations - would be replaced with actual service areas
  const locations = [
    company.city || 'Main City',
    'North Valley',
    'Westside',
    'South Hills',
    'East End',
    'Downtown',
    'Riverside',
    'Oakwood',
    'Pleasant Grove',
    'Highland Park',
    'Meadowbrook',
    'Sunset Heights'
  ];

  return (
    <section id="areas" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Areas We Serve</h2>
          <div className="w-20 h-1 bg-blue-600 mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {company.name} provides professional HVAC services throughout {company.city || 'the local area'} and surrounding communities.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {locations.map((location, index) => (
              <div key={index} className="text-center">
                <div className="p-4 border border-gray-100 rounded-lg hover:bg-blue-50 transition-colors">
                  <p className="font-medium text-gray-700">{location}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Don't see your area? Contact us to check if we serve your location.
            </p>
            {company.phone && (
              <a 
                href={`tel:${company.phone}`} 
                className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
              >
                Call {company.phone}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServiceArea;
