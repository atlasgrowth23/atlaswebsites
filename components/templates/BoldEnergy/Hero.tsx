import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Company } from '@/types';
import { getPhotoUrl } from '@/lib/photo';

interface HeroProps {
  company: Company;
}

const Hero: React.FC<HeroProps> = ({ company }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Get hero image URLs using the photo helper
  const heroImage1 = getPhotoUrl(company, 'hero_img_1', 'boldenergy');
  const heroImage2 = getPhotoUrl(company, 'hero_img_2', 'boldenergy');
  const heroImage3 = getPhotoUrl(company, 'hero_img_3', 'boldenergy');
  
  const slides = [heroImage1, heroImage2, heroImage3].filter(Boolean);
  
  // Auto rotate slides
  useEffect(() => {
    if (slides.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Slideshow background */}
      {slides.map((slide, index) => (
        <div 
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={slide}
            alt={`${company.name} slide ${index + 1}`}
            fill
            className="object-cover"
            priority={index === 0}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-red-900/70 to-blue-900/70"></div>
        </div>
      ))}
      
      {/* Content overlay */}
      <div className="container mx-auto px-4 h-full flex items-center relative z-10">
        <div className="max-w-2xl text-white">
          <div className="inline-block bg-red-600 px-4 py-1 mb-6 text-white font-bold">TRUSTED SINCE 1985</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
            BOLD ENERGY <br/> SOLUTIONS
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            {company.name} brings powerful heating and cooling services to homes and businesses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="bg-red-600 hover:bg-red-700 px-8 py-3 text-white text-lg font-bold uppercase">
              Get Started Today
            </Button>
            {company.phone && (
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-bold uppercase"
              >
                <a href={`tel:${company.phone}`} className="block w-full">
                  {company.phone}
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Slide indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-2 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full ${
                index === currentSlide ? 'bg-white' : 'bg-white/50'
              }`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Hero;