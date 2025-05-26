import React from 'react';
import Image from 'next/image';
import { Company } from '@/types';
import { getPhotoUrl } from '@/lib/photo';
import { Button } from '@/components/ui/button';

interface HeroProps {
  company: Company;
}

const Hero: React.FC<HeroProps> = ({ company }) => {
  const heroImage = getPhotoUrl(company, 'hero_img', 'boldenergy');

  return (
    <div className="relative min-h-[85vh] lg:min-h-[calc(100vh-80px)] flex items-center overflow-hidden">
      {/* Bold Energy Background */}
      <div className="absolute inset-0">
        <Image 
          src={heroImage || '/stock/boldenergy/hero_img.svg'} 
          alt={`Professional services by ${company?.name || 'our company'}`}
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-orange-900/80 via-red-800/70 to-yellow-600/80"></div>
      </div>

      {/* Content - Bold Energy Style */}
      <div className="container mx-auto px-4 z-10 py-16 lg:py-20">
        <div className="max-w-4xl ml-0 md:ml-8 lg:ml-16">
          {/* Company Logo */}
          {company.logoUrl && (
            <div className="mb-8">
              <Image 
                src={company.logoUrl}
                alt={`${company.name} logo`}
                width={200}
                height={120}
                className="object-contain bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-2xl max-w-[200px] max-h-[120px] lg:max-w-[240px] lg:max-h-[140px] border-2 border-yellow-400/50"
                priority
              />
            </div>
          )}
          
          <h1 className="text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-black mb-6 text-white leading-tight">
            <span className="block text-yellow-400">Professional</span> 
            <span className="block">HVAC Services in</span>
            <span className="text-orange-300">{company.display_city || company.city || 'Your Area'}</span>
          </h1>

          <p className="text-lg lg:text-xl text-white/90 mb-8 max-w-xl leading-relaxed">
            Expert heating and cooling solutions to keep your home comfortable year-round with energy-efficient service you can trust.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            {company.phone && (
              <Button className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-6 text-lg rounded-xl transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1">
                <a href={`tel:${company.phone}`} className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  {company.phone}
                </a>
              </Button>
            )}

            <Button className="bg-transparent hover:bg-white/10 text-white font-bold px-8 py-6 text-lg rounded-xl border-2 border-white/50 hover:border-white transition-all duration-300">
              Get a Free Estimate
            </Button>
          </div>

          {/* Bold Energy Features */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 backdrop-blur-sm p-4 rounded-lg border border-yellow-400/30">
              <div className="text-yellow-400 text-2xl mb-2">⚡</div>
              <div className="text-white font-bold">FAST & BOLD</div>
              <div className="text-white/80 text-sm">Quick, powerful solutions</div>
            </div>
            <div className="bg-gradient-to-br from-red-600/20 to-yellow-600/20 backdrop-blur-sm p-4 rounded-lg border border-orange-400/30">
              <div className="text-orange-300 text-2xl mb-2">💪</div>
              <div className="text-white font-bold">PROVEN STRENGTH</div>
              <div className="text-white/80 text-sm">Reliable, tested results</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 backdrop-blur-sm p-4 rounded-lg border border-red-400/30">
              <div className="text-red-300 text-2xl mb-2">🏆</div>
              <div className="text-white font-bold">BOLD GUARANTEE</div>
              <div className="text-white/80 text-sm">100% satisfaction promise</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;