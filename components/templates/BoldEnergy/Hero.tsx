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
                width={160}
                height={160}
                className="object-contain bg-white/20 backdrop-blur-sm rounded-xl p-4 shadow-2xl w-[160px] h-[160px] lg:w-[180px] lg:h-[180px] border-2 border-yellow-400/30"
                priority
              />
            </div>
          )}
          
          <h1 className="text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-black mb-6 text-white leading-tight">
            <span className="block text-yellow-400">BOLD</span> 
            <span className="block">SOLUTIONS FOR</span>
            <span className="text-orange-300">{company.city || 'YOUR AREA'}</span>
          </h1>

          <p className="text-lg lg:text-xl text-white/95 mb-8 max-w-2xl leading-relaxed font-medium">
            Powerful, reliable service that gets results. Experience the bold difference with professional solutions that exceed expectations every time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            {company.phone && (
              <Button className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-6 text-lg rounded-xl transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1 border-2 border-yellow-300">
                <a href={`tel:${company.phone}`} className="flex items-center">
                  🔥 CALL NOW: {company.phone}
                </a>
              </Button>
            )}
            <Button className="bg-transparent hover:bg-white/10 text-white font-bold px-8 py-6 text-lg rounded-xl border-2 border-white/50 hover:border-white transition-all duration-300">
              GET BOLD RESULTS
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