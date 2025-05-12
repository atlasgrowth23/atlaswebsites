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

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center overflow-hidden">
      {/* Background with gradient overlay for more depth */}
      <div className="absolute inset-0">
        <Image 
          src={heroImage || '/stock/moderntrust/hero_img.svg'} 
          alt="Professional HVAC services"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70"></div>
      </div>

      {/* Content with better layout and visual hierarchy */}
      <div className="container mx-auto px-4 z-10 py-20">
        <div className="max-w-3xl ml-0 md:ml-12 lg:ml-24">
          <div className="bg-blue-600/10 backdrop-blur-sm px-1 py-1 rounded-md inline-flex items-center mb-4 border-l-4 border-blue-600">
            <span className="ml-2 text-white font-medium tracking-wide">Trusted HVAC Services</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white leading-tight">
            <span className="block">Modern Climate</span> 
            <span className="block">Solutions in</span>
            <span className="text-blue-400">{company.city || 'Your Area'}</span>
          </h1>

          <p className="text-xl text-white/90 mb-8 max-w-xl leading-relaxed">
            Expert heating and cooling services that prioritize energy efficiency, comfort, and long-term reliability for your home or business.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg font-medium rounded-md transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/30">
              Get a Free Quote
            </Button>

            {company.phone && (
              <Button variant="outline" className="border-2 border-white/30 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 hover:border-white/50 px-8 py-6 text-lg font-medium rounded-md transition-all duration-300">
                <a href={`tel:${company.phone}`} className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  {company.phone}
                </a>
              </Button>
            )}
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex items-center space-x-6">
            <div className="flex items-center bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
              <div className="text-yellow-400 flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
              <span className="ml-2 text-sm font-semibold text-white">5.0 <span className="text-white/60 text-xs">(120+ Reviews)</span></span>
            </div>

            <div className="hidden md:flex items-center bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="ml-2 text-sm font-medium text-white">Licensed & Insured</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;