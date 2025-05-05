import React from 'react';
import { Company } from '@/types';

interface LocationMapProps {
  company: Company;
}

const LocationMap: React.FC<LocationMapProps> = ({ company }) => {
  const mapApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapUrl = company.place_id
    ? `https://www.google.com/maps/embed/v1/place?key=${mapApiKey}&q=place_id:${company.place_id}`
    : `https://www.google.com/maps/embed/v1/place?key=${mapApiKey}&q=${encodeURIComponent(
        `${company.name}, ${company.address || ''} ${company.city}, ${company.state} ${company.zip_code || ''}`
      )}`;

  return (
    <section id="location" className="py-16 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Our Location</h2>
          <p className="text-gray-600 mt-2">Serving {company.city}, {company.state} and surrounding areas</p>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {mapApiKey ? (
            <div className="aspect-w-16 aspect-h-9">
              <iframe
                title={`${company.name} location map`}
                width="100%"
                height="450"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={mapUrl}
              ></iframe>
            </div>
          ) : (
            <div className="h-64 bg-slate-200 flex items-center justify-center">
              <p className="text-gray-600">Map will be displayed here</p>
            </div>
          )}
          
          <div className="p-6">
            <h3 className="text-xl font-bold mb-4">{company.name}</h3>
            <div className="space-y-2">
              {company.address && (
                <p className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-map-pin mr-3 text-slate-700 mt-1">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>
                    {company.address}<br />
                    {company.city}, {company.state} {company.zip_code || ''}
                  </span>
                </p>
              )}
              
              {company.phone && (
                <p className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-phone mr-3 text-slate-700">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  {company.phone}
                </p>
              )}
              
              {company.email && (
                <p className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-mail mr-3 text-slate-700">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  {company.email}
                </p>
              )}
              
              {company.hours && (
                <div className="flex items-start mt-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-clock mr-3 text-slate-700 mt-1">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <div>
                    <p className="font-medium mb-1">Business Hours</p>
                    <ul className="space-y-1">
                      {Object.entries(company.hours).map(([day, hours]) => (
                        <li key={day}>
                          <span className="font-medium">{day}:</span> {hours}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationMap;
