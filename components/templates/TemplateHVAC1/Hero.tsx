import React from 'react';
import { Button } from '@/components/ui/button';
import { Company } from '@/types';

interface HeroProps {
  company: Company;
}

const Hero: React.FC<HeroProps> = ({ company }) => {
  return (
    <div className="hvac-hero relative py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {company.name}
          </h1>
          <h2 className="text-xl md:text-2xl text-white/90 mb-8">
            Professional HVAC Services in {company.city}, {company.state}
          </h2>
          <p className="text-white/80 text-lg mb-8">
            {company.description || 
              `Reliable heating and cooling services for residential and commercial properties. 
              Our certified technicians provide quality installations, repairs, and maintenance.`}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="bg-secondary hover:bg-secondary/90 text-white px-8 py-3 text-lg">
              Get a Free Quote
            </Button>
            {company.phone && (
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 px-8 py-3 text-lg"
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