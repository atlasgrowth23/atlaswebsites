import React from 'react';
import { Company } from '@/types';

interface LocationMapProps {
  company: Company;
}

const LocationMap: React.FC<LocationMapProps> = ({ company }) => {
  // The place_id is used to embed a Google Map
  // Note: This requires a Google Maps API key to be set in the environment variables
  const mapUrl = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && company.place_id
    ? `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=place_id:${company.place_id}`
    : `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(`${company.full_address || ''} ${company.city || ''}, ${company.state || ''}`)}`;

  return (
    <section className="py-16" id="contact">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Our Location</h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            {company.name} proudly serves{company.city ? ` ${company.city}` : ''}{company.state ? `, ${company.state}` : ''} and surrounding areas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Contact Information */}
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="text-primary mr-4 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-700">Address</div>
                  <address className="not-italic text-gray-600">
                    {company.full_address || ''}<br />
                    {company.city ? `${company.city}` : ''}{company.state ? `, ${company.state}` : ''}
                  </address>
                </div>
              </div>
              
              {company.phone && (
                <div className="flex items-start">
                  <div className="text-primary mr-4 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-700">Phone</div>
                    <div className="text-gray-600">
                      <a href={`tel:${company.phone}`} className="hover:text-primary">{company.phone}</a>
                    </div>
                  </div>
                </div>
              )}
              
              {company.facebook && (
                <div className="flex items-start">
                  <div className="text-primary mr-4 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-700">Social Media</div>
                    <div className="text-gray-600">
                      <a href={company.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-primary">Facebook Page</a>
                    </div>
                  </div>
                </div>
              )}
              
              {company.working_hours && (
                <div className="flex items-start">
                  <div className="text-primary mr-4 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-700">Business Hours</div>
                    <div className="text-gray-600 text-sm">
                      {company.working_hours}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Map */}
          <div className="h-96 bg-gray-200 rounded-lg overflow-hidden">
            {company.place_id ? (
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={mapUrl}
                allowFullScreen
                title={`${company.name} location`}
              ></iframe>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                Map placeholder - Google Maps API key required
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationMap;