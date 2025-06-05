import React from 'react';
import Image from 'next/image';
import { Company } from '@/types';
import { getPhotoUrl } from '@/lib/photo';

interface HeroProps {
  company: Company;
}

const Hero: React.FC<HeroProps> = ({ company }) => {
  // Single hero configuration
  const heroConfig = {
    image: getPhotoUrl(company, 'hero_img', 'moderntrust'),
    title: `Professional HVAC Service in`,
    subtitle: (company as any).display_city || company.city || 'Your Area',
    description: "Licensed technicians providing reliable heating and cooling solutions for your home and business."
  };

  return (
    <div className="relative min-h-[85vh] lg:min-h-[calc(100vh-80px)] flex items-center overflow-hidden">
      {/* Single Hero Background */}
      <div className="absolute inset-0">
        {heroConfig.image && (
          <Image 
            src={heroConfig.image} 
            alt={`Professional HVAC services by ${company?.name || 'our company'}`}
            fill
            className="object-cover object-center"
            priority
            quality={90}
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70"></div>
      </div>

      {/* Hero Content - Improved positioning and layout */}
      <div className="container mx-auto px-4 z-10 py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[60vh]">
          
          {/* Left Column - Main Content */}
          <div className="text-center lg:text-left space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight">
                <span className="block">{heroConfig.title}</span> 
                <span className="text-red-400 drop-shadow-lg">{heroConfig.subtitle}</span>
              </h1>

              <p className="text-xl lg:text-2xl text-white/95 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
                {heroConfig.description}
              </p>
            </div>

            {/* Action Buttons - Improved layout */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {company.phone && (
                <a 
                  href={`tel:${company.phone}`}
                  className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/30 transform hover:-translate-y-1 flex items-center justify-center group border-2 border-red-500/30"
                >
                  <svg className="h-6 w-6 mr-3 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <div className="text-lg">{company.phone}</div>
                    <div className="text-sm opacity-90">Call Now - Free Estimate</div>
                  </div>
                </a>
              )}

              <button className="border-2 border-white bg-white/10 backdrop-blur-md text-white hover:bg-white hover:text-gray-900 px-8 py-4 rounded-xl text-lg font-bold transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1">
                <div className="flex items-center justify-center">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Get Free Quote
                </div>
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4">
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white font-medium">Licensed & Insured</span>
              </div>
              {(company as any).emergency_service && (
                <div className="flex items-center space-x-2 bg-red-500/20 backdrop-blur-sm px-4 py-2 rounded-full border border-red-400/30">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-white font-medium">24/7 Emergency</span>
                </div>
              )}
              {(company as any).rating && parseFloat((company as any).rating) >= 4.5 && (
                <div className="flex items-center space-x-2 bg-yellow-500/20 backdrop-blur-sm px-4 py-2 rounded-full border border-yellow-400/30">
                  <div className="text-yellow-400 flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-white font-medium">{Number((company as any).rating).toFixed(1)} Stars</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Additional Content Space */}
          <div className="hidden lg:block">
            {/* This space could be used for additional content like service highlights, certifications, or testimonials */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;