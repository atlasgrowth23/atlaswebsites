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
    <div className="relative py-24 md:py-36 bg-gradient-to-r from-primary to-primary/80 text-on-primary overflow-hidden">
      {heroImageUrl && heroImageUrl !== "Yes" && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70 z-10"></div>
          <Image
            src={heroImageUrl}
            alt="Hero background"
            fill
            className="object-cover opacity-30"
            priority
          />
        </>
      )}
      <div className="container mx-auto px-4 relative z-20">
        <div className="max-w-3xl">
          <div className="inline-block bg-secondary/90 px-4 py-1 rounded-full text-white text-sm font-medium mb-6">
            Trusted HVAC Experts Since {company.site_company_insights_founded_year || '1995'}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white">
            {company.name}
          </h1>
          <h2 className="text-xl md:text-2xl text-white/90 mb-8 font-light">
            Professional HVAC Services{company.city ? ` in ${company.city}` : ''}{company.state ? `, ${company.state}` : ''}
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-2xl">
            {company.site_company_insights_description || 
              `Reliable heating and cooling services for residential and commercial properties. 
              Our certified technicians provide quality installations, repairs, and maintenance.`}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="bg-secondary text-on-secondary hover:bg-secondary/90 px-8 py-6 text-lg font-bold rounded-md shadow-lg hover:shadow-xl transition-all duration-300">
              Get a Free Quote
            </Button>
            {company.phone && (
              <Button 
                variant="outline" 
                className="border-white/30 hover:bg-white/20 px-8 py-6 text-lg rounded-md backdrop-blur-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
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