import { useEffect, useRef, useState } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';

type Address = {
  street: string;
  city: string;
  state: string;
  zip: string;
  lat?: number;
  lng?: number;
  formatted?: string;
};

type AddressInputProps = {
  value?: Address | null;
  onChange: (address: Address) => void;
  placeholder?: string;
  className?: string;
};

export default function AddressInput({ 
  value, 
  onChange, 
  placeholder = "Enter address...",
  className = ''
}: AddressInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    // Update display value when value prop changes
    if (value?.formatted) {
      setDisplayValue(value.formatted);
    } else if (value?.street) {
      setDisplayValue(`${value.street}, ${value.city}, ${value.state} ${value.zip}`);
    } else {
      setDisplayValue('');
    }
  }, [value]);

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google?.maps?.places) {
        initializeAutocomplete();
        return;
      }

      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        // Script already loading, wait for it
        const checkLoaded = setInterval(() => {
          if (window.google?.maps?.places) {
            clearInterval(checkLoaded);
            initializeAutocomplete();
          }
        }, 100);
        return;
      }

      // Load Google Maps script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeAutocomplete;
      script.onerror = () => {
        console.error('Failed to load Google Maps');
      };
      document.head.appendChild(script);
    };

    const initializeAutocomplete = () => {
      if (!inputRef.current || !window.google?.maps?.places) return;

      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ['address'],
          componentRestrictions: { country: 'us' },
          fields: ['address_components', 'formatted_address', 'geometry'],
        }
      );

      autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
      setIsLoaded(true);
    };

    loadGoogleMaps();

    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.address_components) return;

    const components = place.address_components;
    const address: Address = {
      street: '',
      city: '',
      state: '',
      zip: '',
      formatted: place.formatted_address,
      lat: place.geometry?.location?.lat(),
      lng: place.geometry?.location?.lng(),
    };

    // Parse address components
    for (const component of components) {
      const types = component.types;
      
      if (types.includes('street_number')) {
        address.street = component.long_name + ' ';
      } else if (types.includes('route')) {
        address.street += component.long_name;
      } else if (types.includes('locality')) {
        address.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        address.state = component.short_name;
      } else if (types.includes('postal_code')) {
        address.zip = component.long_name;
      }
    }

    address.street = address.street.trim();
    setDisplayValue(address.formatted || '');
    onChange(address);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(e.target.value);
    
    // Clear the structured address if user is typing manually
    if (e.target.value !== value?.formatted) {
      // Don't clear immediately, user might be typing
    }
  };

  const formatAddressDisplay = (addr: Address) => {
    if (addr.formatted) return addr.formatted;
    return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}`.replace(/^, |, $/, '');
  };

  const getDirectionsUrl = () => {
    if (!value?.formatted) return '#';
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(value.formatted)}`;
  };

  return (
    <div className={className}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPinIcon className="h-5 w-5 text-gray-400" />
        </div>
        
        {value?.formatted && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <a
              href={getDirectionsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
              title="Get directions"
            >
              Directions
            </a>
          </div>
        )}
      </div>
      
      {!isLoaded && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Loading address autocomplete...
        </p>
      )}
      
      {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
          Google Maps API key not configured
        </p>
      )}
    </div>
  );
}