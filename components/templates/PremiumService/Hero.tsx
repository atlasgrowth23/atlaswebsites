
import React from 'react';
import Image from 'next/image';
import { Company } from '@/types';
import { getPhotoUrl } from '@/lib/photo';

interface HeroProps {
  company: Company;
}

const Hero: React.FC<HeroProps> = ({ company }) => {
  // Get hero image URL using the photo helper
  const heroImage = getPhotoUrl(company, 'hero_img', 'premiumservice');

  return (
    <div className="relative h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image 
          src={heroImage || '/stock/moderntrust/hero_img.svg'} 
          alt={`${company.name} - Professional HVAC services`}
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40"></div>
      </div>

      {/* Hero Content */}
      <div className="container mx-auto px-4 z-10">
        <div className="max-w-3xl">
          <p className="text-primary font-semibold text-lg mb-4 uppercase tracking-wider">
            {company.city ? `Serving ${company.city} & Surrounding Areas` : 'Your Local HVAC Specialists'}
          </p>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Professional HVAC Solutions For Your <span className="text-primary">Comfort</span> & <span className="text-primary">Peace of Mind</span>
          </h1>
          
          <p className="text-xl text-white/90 mb-8 max-w-xl leading-relaxed">
            Expert heating, ventilation, and air conditioning services that ensure your home or business stays comfortable year-round.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <a 
              href="#contact" 
              className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-md font-medium text-lg transition-colors inline-block"
            >
              Get Free Estimate
            </a>
            
            {company.phone && (
              <a 
                href={`tel:${company.phone}`} 
                className="bg-transparent border-2 border-accent hover:border-accent/70 text-white px-8 py-4 rounded-md font-medium text-lg transition-colors inline-block flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call {company.phone}
              </a>
            )}
          </div>
          
          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center mt-12 gap-6">
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
              <div className="flex items-center">
                <div className="text-yellow-400 flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
                <span className="ml-2 text-white font-medium">5-Star Service</span>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
              <span className="text-white font-medium flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Licensed & Insured
              </span>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
              <span className="text-white font-medium flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                24/7 Emergency Service
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
