import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Company } from '@/types';

interface HeroProps {
  company: Company;
  heroImageUrl?: string | null;
}

const Hero: React.FC<HeroProps> = ({ company, heroImageUrl }) => {
  return (
    <div className="relative py-20 md:py-32 bg-primary text-on-primary">
      {heroImageUrl && heroImageUrl !== "Yes" && (
        <Image
          src={heroImageUrl}
          alt="Hero background"
          fill
          className="object-cover mix-blend-overlay opacity-20"
          priority
        />
      )}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {company.name}
          </h1>
          <h2 className="text-xl md:text-2xl opacity-90 mb-8">
            Professional HVAC Services{company.city ? ` in ${company.city}` : ''}{company.state ? `, ${company.state}` : ''}
          </h2>
          <p className="opacity-80 text-lg mb-8">
            {company.site_company_insights_description || 
              `Reliable heating and cooling services for residential and commercial properties. 
              Our certified technicians provide quality installations, repairs, and maintenance.`}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="bg-secondary text-on-secondary hover:bg-secondary/90 px-8 py-3 text-lg">
              Get a Free Quote
            </Button>
            {company.phone && (
              <Button 
                variant="outline" 
                className="border-white/30 hover:bg-white/20 px-8 py-3 text-lg"
              >
                Call {company.phone}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;