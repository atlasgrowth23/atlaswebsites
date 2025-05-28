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

  // Hero slides with different images and text
  const heroSlides = [
    {
      image: getPhotoUrl(company, 'hero_img', 'moderntrust'),
      title: `Stay Cool This Summer in`,
      subtitle: (company as any).display_city || company.city || 'Your Area',
      description: "Expert cooling solutions that keep your family comfortable during the hottest days while saving on energy costs."
    },
    {
      image: getPhotoUrl(company, 'about_img', 'moderntrust'),
      title: `Professional HVAC Service in`,
      subtitle: (company as any).display_city || company.city || 'Your Area',
      description: "Licensed technicians providing reliable heating and cooling solutions for your home and business."
    }
  ];

  // Auto-rotate slides every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroSlides.length]);

  const currentHero = heroSlides[currentSlide];

  return (
    <div className="relative min-h-[85vh] lg:min-h-[calc(100vh-80px)] flex items-center overflow-hidden">
      {/* Background with smooth animated transitions */}
      <div className="absolute inset-0">
        {heroSlides.map((slide, index) => (
          <Image 
            key={index}
            src={slide.image} 
            alt={`Professional services by ${company?.name || 'our company'}`}
            fill
            className={`object-cover object-center transition-all duration-1000 ease-in-out ${
              index === currentSlide 
                ? 'opacity-100 scale-100' 
                : 'opacity-0 scale-105'
            }`}
            priority={index === 0}
            quality={90}
            sizes="100vw"
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70"></div>
      </div>

      {/* Content - iPhone 14 Pro Max scale for mobile, original desktop scale preserved */}
      <div className="container mx-auto px-4 z-10 py-16 lg:py-20">
        <div className="max-w-3xl ml-0 md:ml-12 lg:ml-24">

          
          <h1 className="text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold mb-6 text-white leading-tight">
            <span className="block">{currentHero.title}</span> 
            <span className="text-primary">{currentHero.subtitle}</span>
          </h1>

          <p className="text-lg lg:text-xl text-white/90 mb-8 max-w-xl leading-relaxed">
            {currentHero.description}
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