import { useEffect, useRef, useState } from 'react';
import { StandaloneSearchBox, useJsApiLoader } from '@react-google-maps/api';
import { MapPinIcon } from '@heroicons/react/24/outline';
import VoiceMicButton from './VoiceMicButton';

const libraries: ("places")[] = ["places"];

type Address = {
  street: string;
  city: string;
  state: string;
  zip: string;
  lat?: number;
  lng?: number;
  formatted?: string;
};

type GoogleAddressInputProps = {
  value?: Address | null;
  onChange: (address: Address) => void;
  placeholder?: string;
  className?: string;
  showVoiceInput?: boolean;
};

export default function GoogleAddressInput({ 
  value, 
  onChange, 
  placeholder = "Enter address...",
  className = '',
  showVoiceInput = true
}: GoogleAddressInputProps) {
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
  const [inputValue, setInputValue] = useState('');

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  useEffect(() => {
    // Update input value when value prop changes
    if (value?.formatted) {
      setInputValue(value.formatted);
    } else if (value?.street) {
      const formatted = `${value.street}, ${value.city}, ${value.state} ${value.zip}`.replace(/^, |, $/, '');
      setInputValue(formatted);
    } else {
      setInputValue('');
    }
  }, [value]);

  const handlePlacesChanged = async () => {
    const searchBox = searchBoxRef.current;
    if (!searchBox) return;

    const places = searchBox.getPlaces();
    if (!places || places.length === 0) return;

    const place = places[0];
    if (!place.address_components) return;

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
    
    // If we have lat/lng but missing it from place, geocode
    if (!address.lat && place.formatted_address) {
      try {
        const geocoder = new google.maps.Geocoder();
        const result = await geocoder.geocode({ 
          address: place.formatted_address 
        });
        
        if (result.results[0]) {
          address.lat = result.results[0].geometry.location.lat();
          address.lng = result.results[0].geometry.location.lng();
        }
      } catch (error) {
        console.warn('Geocoding failed:', error);
      }
    }

    setInputValue(address.formatted || '');
    onChange(address);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleVoiceInput = (transcript: string) => {
    // Smart parsing for common address formats
    const cleanedTranscript = transcript.trim();
    setInputValue(cleanedTranscript);
    
    // Trigger places search if we have a reasonable address
    if (cleanedTranscript.length > 10) {
      // Simulate typing to trigger autocomplete
      setTimeout(() => {
        if (searchBoxRef.current) {
          const places = searchBoxRef.current.getPlaces();
          if (places && places.length > 0) {
            // If autocomplete found something, use it
            handlePlacesChanged();
          }
        }
      }, 500);
    }
  };

  const getDirectionsUrl = () => {
    if (!value?.formatted) return '#';
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(value.formatted)}`;
  };

  if (loadError) {
    return (
      <div className={className}>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
        />
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
          Failed to load Google Maps
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={className}>
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Loading address autocomplete..."
            disabled
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPinIcon className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <StandaloneSearchBox
        onLoad={(ref) => {
          searchBoxRef.current = ref;
        }}
        onPlacesChanged={handlePlacesChanged}
      >
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={`block w-full pl-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 ${
              showVoiceInput ? 'pr-20' : 'pr-3'
            } ${value?.formatted ? 'pr-24' : ''}`}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPinIcon className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="absolute inset-y-0 right-0 flex items-center">
            {showVoiceInput && (
              <div className="pr-2">
                <VoiceMicButton
                  onTranscript={handleVoiceInput}
                  field="address"
                />
              </div>
            )}
            {value?.formatted && (
              <div className="pr-3">
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
        </div>
      </StandaloneSearchBox>
      
    </div>
  );
}