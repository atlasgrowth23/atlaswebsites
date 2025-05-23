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
    // Skip if no coordinates are available or if we're not in the browser
    if (typeof window === 'undefined') return;
    
    // Ensure we have valid coordinates
    const latitude = parseFloat(String(company?.latitude));
    const longitude = parseFloat(String(company?.longitude));
    
    if (isNaN(latitude) || isNaN(longitude)) {
      console.log('Invalid coordinates:', company?.latitude, company?.longitude);
      return;
    }
    
    // Use a simple static map as a fallback option (doesn't require JavaScript)
    const createStaticMap = () => {
      if (!mapRef.current) return;
      
      const width = mapRef.current.clientWidth;
      const height = mapRef.current.clientHeight;
      
      // Create an image element with a static map
      const img = document.createElement('img');
      img.src = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=12&size=${width}x${height}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&markers=color:red|${latitude},${longitude}`;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.alt = `Map showing ${company?.name} location`;
      
      // Clear the loading message and append the image
      mapRef.current.innerHTML = '';
      mapRef.current.appendChild(img);
    };
    
    // Function to initialize Google Maps - using best practices with loading=async
    const initMap = () => {
      // Create a global callback that will run when the Google Maps script loads
      window.initMap = () => {
        if (!mapRef.current || !window.google || !window.google.maps) return;
        
        try {
          const mapOptions = {
            center: { lat: latitude, lng: longitude },
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
          
          // Use AdvancedMarkerElement if available, fall back to Marker if not
          let marker;
          if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
            // Create a simple HTML content for the marker
            const markerContent = document.createElement('div');
            markerContent.innerHTML = `
              <div style="background-color: #0066FF; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3)"></div>
            `;
            
            marker = new window.google.maps.marker.AdvancedMarkerElement({
              map,
              position: { lat: latitude, lng: longitude },
              title: company?.name,
              content: markerContent
            });
          } else {
            // Fall back to regular Marker
            marker = new window.google.maps.Marker({
              position: { lat: latitude, lng: longitude },
              map,
              title: company?.name,
              animation: window.google.maps.Animation.DROP,
            });
          }
          
          // Create a circle to show approximate service area (8 mile radius)
          const serviceAreaCircle = new window.google.maps.Circle({
            strokeColor: '#0066FF',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#0066FF',
            fillOpacity: 0.1,
            map,
            center: { lat: latitude, lng: longitude },
            radius: 12000, // 8 miles in meters (12.8 km)
          });
          
          // Add info window for the marker with geocoded data fallback
          const city = company?.city || company?.geocoded_city || '';
          const state = company?.state || company?.geocoded_state || '';
          const locationDisplay = city && state ? `${city}, ${state}` : city || state || 'Location information not available';
          
          const infoContent = `
            <div style="padding: 8px; max-width: 200px;">
              <h3 style="margin: 0 0 8px; font-weight: bold;">${company?.name}</h3>
              <p style="margin: 0 0 5px;">${locationDisplay}</p>
              ${company?.phone ? `<p style="margin: 0;"><a href="tel:${company?.phone}" style="color: #0066FF; text-decoration: none;">${company?.phone}</a></p>` : ''}
            </div>
          `;
          
          const infoWindow = new window.google.maps.InfoWindow({
            content: infoContent,
          });
          
          // Use the appropriate listener based on marker type
          if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
            marker.addListener('click', () => {
              infoWindow.open(map, marker);
            });
          } else if (marker.addListener) {
            marker.addListener('click', () => {
              infoWindow.open(map, marker);
            });
          }
          
          // Initially open the info window
          infoWindow.open(map, marker);
        } catch (error) {
          console.error('Error rendering map:', error);
          // Fall back to static map if dynamic map fails
          createStaticMap();
        }
      };
      
      // Check if the API is already loaded
      if (window.google && window.google.maps) {
        window.initMap();
        return;
      }
      
      // Load the Google Maps API with the async attribute and callback
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      
      // Set a timeout to fall back to static map if the dynamic map doesn't load
      const timeout = setTimeout(() => {
        if (!window.google || !window.google.maps) {
          console.warn('Google Maps API failed to load, falling back to static map');
          createStaticMap();
        }
      }, 5000);
      
      // Clean up timeout
      return () => clearTimeout(timeout);
    };
    
    initMap();
    
  }, [company]);
  
  // If no coordinates, don't display section
  if (!company?.latitude || !company?.longitude) {
    return null;
  }
  
  // Use geocoded data if regular city/state are missing
  const cityDisplay = company.city || company.geocoded_city || 'your area';
  const stateDisplay = company.state || company.geocoded_state || '';
  
  return (
    <section id="service-area" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Our Service Area</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {company.name} proudly serves {cityDisplay} {stateDisplay ? `and surrounding areas` : `area`} with reliable heating 
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