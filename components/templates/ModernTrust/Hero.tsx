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
  const heroImageUrl = getPhotoUrl(company, 'hero_img', 'moderntrust');
  
  return (
    <div className="relative h-screen bg-blue-900 text-white">
      {/* Background video or image */}
      <div className="absolute inset-0 z-0">
        {heroImageUrl && (
          <Image
            src={heroImageUrl}
            alt={`${company.name} hero`}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-blue-900/50 mix-blend-multiply"></div>
      </div>
      
      {/* Content overlay */}
      <div className="container mx-auto px-4 h-full flex items-center relative z-10">
        <div className="max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Modern Climate Solutions You Can Trust
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            {company.name} delivers advanced heating and cooling systems for ultimate comfort and efficiency.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="bg-white text-blue-900 hover:bg-blue-100 px-8 py-3 text-lg font-medium">
              Schedule Service
            </Button>
            {company.phone && (
              <Button variant="outline" className="border-white/40 hover:bg-white/10 px-8 py-3 text-lg">
                <a href={`tel:${company.phone}`} className="block w-full">
                  Call Us: {company.phone}
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