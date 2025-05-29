import React, { useEffect, useState } from 'react';

declare global {
  interface Window {
    google: any;
  }
  var google: any;
}

interface ServiceAreaProps {
  company: any;
}


const ServiceArea: React.FC<ServiceAreaProps> = ({ company }) => {
  const [mapLoaded, setMapLoaded] = useState(false);

  const latitude = company.latitude || company.lat;
  const longitude = company.longitude || company.lng;

  useEffect(() => {
    // Load Google Maps API
    if (typeof window !== 'undefined' && !window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else if (window.google) {
      setMapLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (mapLoaded && latitude && longitude) {
      initializeMap();
    }
  }, [mapLoaded, latitude, longitude]);

  const initializeMap = () => {
    const mapContainer = document.getElementById('service-area-map');
    if (!mapContainer || !window.google) return;

    const center = new google.maps.LatLng(latitude, longitude);
    
    const map = new google.maps.Map(mapContainer, {
      center,
      zoom: 10,
      styles: [
        {
          featureType: 'administrative.country',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#4285f4' }, { weight: 2 }]
        },
        {
          featureType: 'administrative.province',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#4285f4' }, { weight: 1 }]
        }
      ]
    });

    // Add marker for business location
    new google.maps.Marker({
      position: center,
      map,
      title: company.name,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#dc2626">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(40, 40)
      }
    });

    // Draw 25-mile radius circle
    new google.maps.Circle({
      strokeColor: '#3b82f6',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#3b82f6',
      fillOpacity: 0.15,
      map,
      center,
      radius: 40233.6 // 25 miles in meters
    });
  };


  if (!latitude || !longitude) {
    return null;
  }

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      <div className="container mx-auto px-4">
        {/* Enhanced Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Trusted Service Throughout
            <span className="block text-blue-600">{company.city}, {company.state}</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Professional HVAC services within a 25-mile radius. Fast response times, 
            expert technicians, and guaranteed satisfaction for every customer.
          </p>
        </div>

        {/* Simplified Map Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="relative">
              {!mapLoaded && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading service area map...</p>
                  </div>
                </div>
              )}
              
              <div 
                id="service-area-map" 
                className="w-full h-96 bg-gray-100"
                style={{ minHeight: '500px' }}
              ></div>
              
              {/* Simple Legend */}
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full opacity-30 border-2 border-blue-500"></div>
                    <span className="font-medium">Service Area</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    <span className="font-medium">{company.name}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServiceArea;