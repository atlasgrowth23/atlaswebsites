import React, { useEffect, useRef } from 'react';
import { Company } from '@/types';

// Skip TypeScript checking for Google Maps
// @ts-ignore
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface ServiceAreaProps {
  company: Company;
}

const ServiceArea: React.FC<ServiceAreaProps> = ({ company }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Skip if no coordinates are available
    if (!company?.latitude || !company?.longitude) {
      return;
    }
    
    // Function to initialize Google Maps
    const initMap = async () => {
      // Make sure the Google Maps JavaScript API is loaded
      if (typeof window !== 'undefined' && (!window.google || !window.google.maps)) {
        // Load Google Maps API
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
        
        return new Promise<void>((resolve) => {
          script.onload = () => {
            renderMap();
            resolve();
          };
        });
      } else {
        renderMap();
        return Promise.resolve();
      }
    };
    
    // Function to render the map once API is loaded
    const renderMap = () => {
      if (!mapRef.current || !window.google) return;
      
      const mapOptions = {
        center: { lat: company.latitude!, lng: company.longitude! },
        zoom: 11,
        mapTypeControl: false,
        streetViewControl: false,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      };
      
      const map = new window.google.maps.Map(mapRef.current, mapOptions);
      
      // Create marker for company location
      const marker = new window.google.maps.Marker({
        position: { lat: company.latitude!, lng: company.longitude! },
        map,
        title: company.name,
        animation: window.google.maps.Animation.DROP,
      });
      
      // Create a circle to show approximate service area (8 mile radius)
      const serviceAreaCircle = new window.google.maps.Circle({
        strokeColor: '#0066FF',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#0066FF',
        fillOpacity: 0.1,
        map,
        center: { lat: company.latitude!, lng: company.longitude! },
        radius: 12000, // 8 miles in meters (12.8 km)
      });
      
      // Add info window for the marker
      const infoContent = `
        <div style="padding: 8px; max-width: 200px;">
          <h3 style="margin: 0 0 8px; font-weight: bold;">${company.name}</h3>
          <p style="margin: 0 0 5px;">${company.city}, ${company.state || ''}</p>
          ${company.phone ? `<p style="margin: 0;"><a href="tel:${company.phone}" style="color: #0066FF; text-decoration: none;">${company.phone}</a></p>` : ''}
        </div>
      `;
      
      const infoWindow = new window.google.maps.InfoWindow({
        content: infoContent,
      });
      
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
      
      // Initially open the info window
      infoWindow.open(map, marker);
    };
    
    initMap();
    
  }, [company]);
  
  // If no coordinates, don't display section
  if (!company?.latitude || !company?.longitude) {
    return null;
  }
  
  return (
    <section id="service-area" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Our Service Area</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {company.name} proudly serves {company.city} and surrounding areas with reliable heating 
            and cooling services. Contact us today to see if you're in our service area.
          </p>
        </div>
        
        <div className="shadow-xl rounded-xl overflow-hidden">
          <div 
            ref={mapRef} 
            className="w-full h-[400px] md:h-[500px]"
            style={{ backgroundColor: '#f0f0f0' }}
          >
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-500">Loading map...</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-lg">
            Not sure if we service your area? <a href="#" className="text-blue-600 font-semibold hover:underline">Contact us</a> today!
          </p>
        </div>
      </div>
    </section>
  );
};

export default ServiceArea;