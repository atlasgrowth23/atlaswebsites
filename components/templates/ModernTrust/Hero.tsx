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
    <div className="relative min-h-[85vh] md:min-h-[90vh] lg:min-h-[calc(100vh-80px)] flex items-center overflow-hidden">
      {/* Background with gradient overlay for more depth */}
      <div className="absolute inset-0">
        <Image 
          src={heroImage || '/stock/moderntrust/hero_img.svg'} 
          alt={`Professional services by ${company?.name || 'our company'}`}
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70"></div>
      </div>

      {/* Content scaled for iPhone 14 Pro Max proportions */}
      <div className="container mx-auto px-4 md:px-6 z-10 py-16 md:py-20">
        <div className="max-w-3xl ml-0 md:ml-12 lg:ml-24">
          {/* Company Logo - iPhone 14 Pro Max sizing */}
          {company.logoUrl && (
            <div className="mb-8 md:mb-10">
              <Image 
                src={company.logoUrl}
                alt={`${company.name} logo`}
                width={160}
                height={160}
                className="object-contain bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-lg w-[160px] h-[160px] md:w-[180px] md:h-[180px]"
                priority
              />
            </div>
          )}
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 md:mb-8 text-white leading-tight">
            <span className="block">Stay Cool This</span> 
            <span className="block">Summer in</span>
            <span className="text-primary">{company.city || 'Your Area'}</span>
          </h1>

          <p className="text-lg md:text-xl lg:text-2xl text-white/90 mb-8 md:mb-10 max-w-xl leading-relaxed">
            Expert cooling solutions that keep your family comfortable during the hottest days while saving on energy costs.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            {company.phone && (
              <Button className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg font-medium rounded-md transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5">
                <a href={`tel:${company.phone}`} className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  {company.phone}
                </a>
              </Button>
            )}

            <Button variant="outline" className="border-2 border-accent bg-white/5 backdrop-blur-sm text-white hover:bg-accent/10 hover:border-accent/70 px-8 py-6 text-lg font-medium rounded-md transition-all duration-300">
              Get a Free Estimate
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;