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

interface CountyInfo {
  name: string;
  state: string;
}

const ServiceArea: React.FC<ServiceAreaProps> = ({ company }) => {
  const [nearbyCounties, setNearbyCounties] = useState<CountyInfo[]>([]);
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
      fetchNearbyCounties();
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

  const fetchNearbyCounties = async () => {
    try {
      // Use Google Maps Geocoding API to get nearby administrative areas
      const geocoder = new google.maps.Geocoder();
      
      // Get counties within approximate radius
      const counties = new Set<string>();
      
      // Sample points around the main location to find counties
      const radiusPoints = [
        { lat: latitude + 0.2, lng: longitude },
        { lat: latitude - 0.2, lng: longitude },
        { lat: latitude, lng: longitude + 0.2 },
        { lat: latitude, lng: longitude - 0.2 },
        { lat: latitude + 0.15, lng: longitude + 0.15 },
        { lat: latitude - 0.15, lng: longitude - 0.15 },
        { lat: latitude + 0.15, lng: longitude - 0.15 },
        { lat: latitude - 0.15, lng: longitude + 0.15 }
      ];

      const promises = radiusPoints.map(point => 
        new Promise<void>((resolve) => {
          geocoder.geocode({ location: point }, (results: any, status: any) => {
            if (status === 'OK' && results) {
              results.forEach((result: any) => {
                result.address_components.forEach((component: any) => {
                  if (component.types.includes('administrative_area_level_2')) {
                    const countyName = component.long_name.replace(' County', '');
                    const state = result.address_components.find((c: any) => 
                      c.types.includes('administrative_area_level_1')
                    )?.short_name || '';
                    counties.add(`${countyName}, ${state}`);
                  }
                });
              });
            }
            resolve();
          });
        })
      );

      await Promise.all(promises);
      
      const countyList = Array.from(counties)
        .filter(county => county.includes(company.state?.substring(0, 2) || ''))
        .slice(0, 8)
        .map(county => {
          const [name, state] = county.split(', ');
          return { name, state };
        });

      setNearbyCounties(countyList);
    } catch (error) {
      console.error('Error fetching counties:', error);
    }
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

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Enhanced Map Section */}
          <div className="order-2 lg:order-1">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700">
                <h3 className="text-xl font-bold text-white mb-2">Service Coverage Map</h3>
                <p className="text-blue-100">We serve a 25-mile radius from our main location</p>
              </div>
              
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
                  style={{ minHeight: '400px' }}
                ></div>
                
                {/* Enhanced Legend */}
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full opacity-30 border-2 border-blue-500"></div>
                      <span className="font-medium">25-Mile Service Area</span>
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

          {/* Enhanced Service Info */}
          <div className="order-1 lg:order-2 space-y-8">
            
            {/* Service Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-100">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">25+</div>
                  <div className="text-sm text-gray-600">Mile Service Radius</div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg border border-green-100">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">24/7</div>
                  <div className="text-sm text-gray-600">Emergency Service</div>
                </div>
              </div>
            </div>

            {/* Main Service Area Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                <h3 className="text-2xl font-bold text-white mb-2">Service Coverage</h3>
                <p className="text-blue-100">Professional HVAC services across the region</p>
              </div>
              
              <div className="p-6">
                {/* Primary Location */}
                <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">Primary Service Area</div>
                      <div className="text-gray-600">{company.city}, {company.state} & Surrounding Communities</div>
                    </div>
                  </div>
                </div>

                {/* Service Features */}
                <div className="space-y-4 mb-6">
                  <h4 className="font-bold text-gray-900 mb-3">What We Offer</h4>
                  {[
                    { icon: "🚨", text: "Same-day emergency service", color: "text-red-600" },
                    { icon: "⚡", text: "Fast response times", color: "text-yellow-600" },
                    { icon: "🛡️", text: "Licensed & insured technicians", color: "text-blue-600" },
                    { icon: "✅", text: "100% satisfaction guarantee", color: "text-green-600" },
                    { icon: "💯", text: "Upfront pricing", color: "text-purple-600" }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <span className="text-xl">{feature.icon}</span>
                      <span className="text-gray-700 font-medium">{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* Service Areas List */}
                {nearbyCounties.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-bold text-gray-900 mb-3">Service Areas Include</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {nearbyCounties.slice(0, 6).map((county, index) => (
                        <div key={index} className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                          {county.name} County
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Call to Action */}
                {company.phone && (
                  <div className="space-y-3">
                    <a 
                      href={`tel:${company.phone}`}
                      className="block w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white text-center py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-red-500/30 transform hover:-translate-y-0.5"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>Call {company.phone}</span>
                      </div>
                      <div className="text-sm opacity-90 mt-1">Free Consultation & Estimates</div>
                    </a>
                    <p className="text-center text-sm text-gray-500">
                      Average response time: <span className="font-semibold text-blue-600">Under 2 hours</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServiceArea;