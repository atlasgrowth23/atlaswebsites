
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getPhotoUrl } from '@/lib/photo';
import { Company } from '@/types';

interface HeroProps {
  company: Company;
}

const Hero: React.FC<HeroProps> = ({ company }) => {
  // Get hero image URL using the photo helper
  const heroImage = getPhotoUrl(company, 'hero_img', 'brownneck');

  return (
    <section className="relative bg-amber-900 text-white overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-30">
        {heroImage ? (
          <Image 
            src={heroImage}
            alt={`${company.name} hero background`}
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-800 to-amber-950"></div>
        )}
      </div>

      <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            {company.name}
          </h1>

          <h2 className="text-xl md:text-2xl font-medium mb-8 text-amber-200">
            Professional HVAC Services in {company.city}, {company.state}
          </h2>

          <p className="text-lg mb-10 text-amber-100 max-w-2xl">
            {company.site_company_insights_description || 
            `Trusted heating and cooling experts providing exceptional service to homes and businesses in ${company.city} and surrounding areas.`}
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button className="px-8 py-3 bg-white text-amber-900 font-semibold rounded-md hover:bg-amber-100 transition-colors">
              Request Service
            </button>
            <button className="px-8 py-3 border-2 border-white text-white font-semibold rounded-md hover:bg-white/10 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-amber-950 to-transparent"></div>
    </section>
  );
};

export default Hero;
