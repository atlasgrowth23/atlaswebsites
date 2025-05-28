import React, { useEffect, useState } from 'react';

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
          geocoder.geocode({ location: point }, (results, status) => {
            if (status === 'OK' && results) {
              results.forEach(result => {
                result.address_components.forEach(component => {
                  if (component.types.includes('administrative_area_level_2')) {
                    const countyName = component.long_name.replace(' County', '');
                    const state = result.address_components.find(c => 
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
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Service Area Coverage
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We proudly serve a 25-mile radius around {company.city}, {company.state} and surrounding counties
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Map */}
          <div className="order-2 lg:order-1">
            <div className="relative">
              <div 
                id="service-area-map" 
                className="w-full h-96 rounded-xl shadow-lg bg-gray-100"
                style={{ minHeight: '400px' }}
              ></div>
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>25-Mile Service Radius</span>
                </div>
                <div className="flex items-center space-x-2 text-sm mt-1">
                  <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                  <span>{company.name} Location</span>
                </div>
              </div>
            </div>
          </div>

          {/* Service Info */}
          <div className="order-1 lg:order-2">
            <div className="bg-blue-50 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Service Area
              </h3>
              
              <div className="mb-6 text-center">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="font-semibold text-gray-900 text-lg">25-Mile Radius</div>
                  <div className="text-sm text-gray-600">from {company.city}, {company.state}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Same-day emergency service</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Licensed & insured technicians</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">100% satisfaction guarantee</span>
                </div>
              </div>

              {company.phone && (
                <div className="mt-6 pt-6 border-t border-blue-200">
                  <a 
                    href={`tel:${company.phone}`}
                    className="block w-full bg-primary text-white text-center py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Call {company.phone}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServiceArea;