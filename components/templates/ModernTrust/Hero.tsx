
import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Company } from '@/types';
import { getPhotoUrl } from '@/lib/photo';

interface HeroProps {
  company: Company;
}

const Hero: React.FC<HeroProps> = ({ company }) => {
  // Get hero image URL using the photo helper
  const heroImage = getPhotoUrl(company, 'hero_img', 'moderntrust');
  console.log('Hero image URL:', heroImage);
  
  // Create customized headline with city if available
  const headline = company.city 
    ? `Modern, Reliable HVAC Solutions in ${company.city}`
    : 'Modern, Reliable HVAC Solutions';
  
  return (
    <div className="relative h-[500px] md:h-[600px] overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image 
          src={heroImage || '/stock/moderntrust/hero_img.svg'} 
          alt={`${company.name} hero image`}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50"></div>
      </div>
      
      {/* Content overlay */}
      <div className="container mx-auto px-4 h-full flex items-center relative z-10">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            {headline}
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            {company.name} delivers cutting-edge heating and cooling solutions with a focus on energy efficiency and customer satisfaction.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg">
              Get a Quote
            </Button>
            {company.phone && (
              <Button variant="outline" className="border-blue-600 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 px-6 py-3 text-lg">
                <a href={`tel:${company.phone}`} className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  {company.phone}
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
