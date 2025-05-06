import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Company } from '@/types';

interface HeroProps {
  company: Company;
  heroImageUrl?: string | null;
}

const Hero: React.FC<HeroProps> = ({ company, heroImageUrl }) => {
  // Determine location display based on available data
  const locationText = () => {
    if (company.city) return `in ${company.city}${company.state ? `, ${company.state}` : ''}`;
    if (company.full_address) return `- ${company.full_address.split(',')[0]}`;
    return '';
  };

  return (
    <div className="relative py-24 md:py-36 bg-primary text-on-primary">
      {/* Background image - only shown if valid URL is provided */}
      {heroImageUrl && (
        <Image
          src={heroImageUrl}
          alt="Hero background"
          fill
          className="object-cover mix-blend-overlay opacity-20"
          priority
        />
      )}
      
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent"></div>
      
      {/* Content overlay - always visible */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-md">
            {company.name}
          </h1>
          <h2 className="text-xl md:text-3xl font-medium opacity-90 mb-8 drop-shadow-sm">
            Quality HVAC Solutions {locationText()}
          </h2>
          
          {/* Simplified description */}
          <p className="opacity-90 text-lg md:text-xl mb-10 max-w-2xl leading-relaxed">
            Reliable heating, cooling, and ventilation services for your home or business.
          </p>
          
          {/* More prominent call-to-action buttons */}
          <div className="flex flex-col sm:flex-row gap-5">
            <Button className="bg-secondary text-on-secondary hover:bg-secondary/90 px-10 py-6 text-lg font-semibold rounded-lg shadow-lg transition-transform hover:scale-105">
              Get a Free Estimate
            </Button>
            {company.phone && (
              <Button 
                variant="outline" 
                className="border-white/30 hover:bg-white/20 px-10 py-6 text-lg font-semibold rounded-lg shadow-lg transition-transform hover:scale-105"
              >
                <a href={`tel:${company.phone}`} className="flex items-center gap-2 w-full text-inherit">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call {company.phone}
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;