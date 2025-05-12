
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
  console.log('Hero image URL:', heroImage); // For debugging
  
  return (
    <div className="relative bg-gray-50 py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 text-sm font-medium rounded-full mb-6">
              Trusted HVAC Experts
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Modern, Reliable HVAC Solutions
            </h1>
            <p className="text-lg text-gray-700 mb-8">
              {company.name} delivers cutting-edge heating and cooling solutions with a focus on energy efficiency and customer satisfaction.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3">
                Get a Quote
              </Button>
              {company.phone && (
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3">
                  <a href={`tel:${company.phone}`} className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    Call Us
                  </a>
                </Button>
              )}
            </div>
          </div>
          
          <div className="relative h-64 md:h-96">
            <Image 
              src={heroImage || '/public/stock/moderntrust/hero_img.svg'} 
              alt={`${company.name} hero image`}
              fill
              className="object-contain rounded-lg shadow-lg"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
