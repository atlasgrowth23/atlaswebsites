import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Heading } from '@/components/ui/heading';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
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
      {/* Background with advanced gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70">
        <div className="absolute inset-0 mix-blend-overlay opacity-40 bg-gradient-to-r from-blue-900/70 to-purple-900/70"></div>
        <AspectRatio ratio={16/9} className="h-full">
          <Image 
            src={heroImage || '/stock/moderntrust/hero.jpg'} 
            alt="Professional HVAC services"
            fill
            className="object-cover object-center mix-blend-overlay"
            priority
          />
        </AspectRatio>
      </div>

      {/* Content with improved typography and layout */}
      <Container className="z-10 py-20">
        <div className="max-w-3xl ml-0 md:ml-12 lg:ml-24 relative">
          <Badge 
            variant="outline" 
            className="mb-6 py-1.5 px-4 text-sm font-medium bg-primary/10 text-primary border-primary/20 backdrop-blur-sm"
          >
            Trusted HVAC Professionals
          </Badge>
          
          <Heading 
            level={1} 
            className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white leading-tight drop-shadow-md"
          >
            <span className="block">Stay Cool This</span> 
            <span className="block">Summer in</span>
            <span className="text-primary">{company.city || 'Your Area'}</span>
          </Heading>

          <Text className="text-xl text-white/90 mb-8 max-w-xl leading-relaxed drop-shadow-sm">
            Expert cooling solutions that keep your family comfortable during the hottest days 
            while saving on energy costs.
          </Text>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            {company.phone && (
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg font-medium rounded-md transition-all duration-300 hover:shadow-lg"
              >
                <a href={`tel:${company.phone}`} className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  {company.phone}
                </a>
              </Button>
            )}

            <Button 
              variant="outline" 
              size="lg"
              className="border-2 border-accent bg-white/5 backdrop-blur-sm text-white hover:bg-accent/10 hover:border-accent/70 px-8 py-6 text-lg font-medium rounded-md transition-all duration-300"
            >
              Get a Free Estimate
            </Button>
          </div>
          
          {/* Added floating stats cards */}
          <div className="hidden md:flex absolute -bottom-16 right-0 gap-4">
            <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md p-4 rounded-lg border border-white/20 w-28">
              <span className="text-3xl font-bold text-primary">24/7</span>
              <span className="text-xs text-white/80">Emergency Service</span>
            </div>
            <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md p-4 rounded-lg border border-white/20 w-28">
              <span className="text-3xl font-bold text-primary">100%</span>
              <span className="text-xs text-white/80">Satisfaction</span>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Hero;