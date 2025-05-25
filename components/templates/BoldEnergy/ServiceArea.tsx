import React, { useEffect, useRef } from 'react';
import { Company } from '@/types';

interface ServiceAreaProps {
  company: Company;
}

const ServiceArea: React.FC<ServiceAreaProps> = ({ company }) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current || !company?.latitude || !company?.longitude) return;

    const initMap = () => {
      if (!window.google || !window.google.maps) {
        console.log('Google Maps not loaded yet');
        return;
      }

      const latitude = Number(company.latitude);
      const longitude = Number(company.longitude);

      if (isNaN(latitude) || isNaN(longitude)) {
        console.log('Invalid coordinates:', company.latitude, company.longitude);
        return;
      }

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
          // Create a simple HTML content for the marker with BoldEnergy orange theme
          const markerContent = document.createElement('div');
          markerContent.innerHTML = `
            <div style="background-color: #ea580c; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3)"></div>
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
        
        // Create a circle to show approximate service area (8 mile radius) with BoldEnergy orange theme
        const serviceAreaCircle = new window.google.maps.Circle({
          strokeColor: '#ea580c',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#ea580c',
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
            <p style="margin: 0 0 8px; color: #666;">${locationDisplay}</p>
            ${company?.phone ? `<p style="margin: 0; color: #ea580c; font-weight: bold;">${company.phone}</p>` : ''}
          </div>
        `;
        
        const infoWindow = new window.google.maps.InfoWindow({
          content: infoContent
        });
        
        // Add click event to marker to open info window
        if (marker.addListener) {
          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });
        } else if (marker.addEventListener) {
          marker.addEventListener('click', () => {
            infoWindow.open(map, marker);
          });
        }
        
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initMap();
    } else {
      // Wait for Google Maps to load
      const checkGoogleMaps = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkGoogleMaps);
          initMap();
        }
      }, 100);

      // Clean up interval after 10 seconds to prevent infinite checking
      setTimeout(() => {
        clearInterval(checkGoogleMaps);
      }, 10000);
    }
  }, [company]);

  return (
    <section id="service-area" className="py-20 bg-gradient-to-br from-orange-100 via-red-50 to-yellow-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6">
            <span className="text-orange-600">LOCAL</span> SERVICE AREA
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Bringing professional solutions to {company?.city || 'your area'} and surrounding communities
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="bg-gradient-to-br from-orange-200 to-red-200 p-8 rounded-2xl border-2 border-orange-300">
              <h3 className="text-2xl font-black text-gray-900 mb-6">
                🗺️ COVERAGE AREAS
              </h3>
              
              <div className="space-y-4">
                {company?.city && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-lg font-bold text-gray-800">
                      {company.city}, {company?.state || 'Local Area'}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-lg font-bold text-gray-800">
                    Surrounding Communities
                  </span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-lg font-bold text-gray-800">
                    Emergency Service Available
                  </span>
                </div>
              </div>
              
              {company?.phone && (
                <div className="mt-8">
                  <a 
                    href={`tel:${company.phone}`}
                    className="block w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-black py-4 px-6 rounded-lg text-center text-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
                  >
                    🔥 CALL FOR EXPERT SERVICE: {company.phone}
                  </a>
                </div>
              )}
            </div>
          </div>
          
          <div className="relative">
            {/* Interactive Map */}
            {company?.latitude && company?.longitude ? (
              <div className="bg-white p-2 rounded-2xl border-2 border-orange-300 shadow-xl">
                <div
                  ref={mapRef}
                  className="w-full h-80 rounded-xl"
                  style={{ minHeight: '320px' }}
                />
              </div>
            ) : (
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border-2 border-yellow-400">
                <h3 className="text-2xl font-black text-white mb-6">
                  ⚡ RAPID RESPONSE ZONES
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-4 rounded-lg border border-orange-400/30">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold">Same Day Service</span>
                      <span className="text-yellow-400 font-black">⚡ FAST</span>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-red-500/20 to-yellow-500/20 p-4 rounded-lg border border-red-400/30">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold">24/7 Emergency</span>
                      <span className="text-yellow-400 font-black">🔥 READY</span>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 p-4 rounded-lg border border-yellow-400/30">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold">Weekend Service</span>
                      <span className="text-yellow-400 font-black">💪 RELIABLE</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServiceArea;