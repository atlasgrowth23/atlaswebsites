import React, { useEffect, useRef } from 'react';

// Define type declarations for Google Maps JavaScript API
declare namespace google.maps.places {
  interface Autocomplete {
    addListener: (event: string, callback: () => void) => void;
    getPlace: () => {
      address_components?: Array<{
        long_name: string;
        short_name: string;
        types: string[];
      }>;
      formatted_address?: string;
    };
  }
}

// Only define the Window interface if it hasn't been defined elsewhere
interface GoogleMapsWindow extends Window {
  google: {
    maps: {
      places: {
        Autocomplete: new (
          input: HTMLInputElement,
          options?: {
            types?: string[];
            componentRestrictions?: { country: string };
          }
        ) => google.maps.places.Autocomplete;
      };
      event: {
        clearInstanceListeners: (instance: any) => void;
      };
    };
  };
}

interface GooglePlacesAutocompleteProps {
  onAddressSelected: (
    address: string,
    city: string,
    state: string,
    zip: string
  ) => void;
  placeholder?: string;
  className?: string;
}

const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  onAddressSelected,
  placeholder = 'Enter your address',
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    // Load Google Maps JavaScript API
    const loadGoogleMapsAPI = () => {
      // Check if Google Maps API is already loaded
      if (window.google && window.google.maps && window.google.maps.places) {
        initAutocomplete();
        return;
      }

      // If not loaded, create script element and load it
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initAutocomplete;
      document.head.appendChild(script);
    };

    // Initialize autocomplete functionality
    const initAutocomplete = () => {
      if (!inputRef.current) return;

      // Create autocomplete instance
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' },
      });

      // Add listener for place selection
      autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
    };

    loadGoogleMapsAPI();

    return () => {
      // Clean up event listener
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  // Handle place selection
  const handlePlaceSelect = () => {
    if (!autocompleteRef.current) return;

    const place = autocompleteRef.current.getPlace();
    if (!place.address_components) return;

    let streetNumber = '';
    let route = '';
    let city = '';
    let state = '';
    let zip = '';

    // Extract address components
    for (const component of place.address_components) {
      const componentType = component.types[0];

      switch (componentType) {
        case 'street_number':
          streetNumber = component.long_name;
          break;
        case 'route':
          route = component.long_name;
          break;
        case 'locality':
          city = component.long_name;
          break;
        case 'administrative_area_level_1':
          state = component.short_name;
          break;
        case 'postal_code':
          zip = component.long_name;
          break;
      }
    }

    // Construct full address
    const address = streetNumber && route ? `${streetNumber} ${route}` : place.formatted_address || '';

    // Call callback with extracted data
    onAddressSelected(address, city, state, zip);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      className={className}
      aria-label="Address"
    />
  );
};

export default GooglePlacesAutocomplete;