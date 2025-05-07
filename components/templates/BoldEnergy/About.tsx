import React from 'react';
import Image from 'next/image';
import { Company } from '@/types';
import { getPhotoUrl } from '@/lib/photo';

interface AboutProps {
  company: Company;
}

const About: React.FC<AboutProps> = ({ company }) => {
  // Get about image URL using the photo helper
  const aboutImageUrl = getPhotoUrl(company, 'about_img', 'boldenergy');
  
  return (
    <section className="py-24 bg-gray-100" id="about">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 uppercase mb-4">
            OUR STORY
          </h2>
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-1 w-12 bg-red-600"></div>
            <span className="text-xl font-bold text-blue-600">SINCE {company.site_company_insights_founded_year || '1985'}</span>
            <div className="h-1 w-12 bg-blue-600"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Image side - takes 5 columns on large screens */}
          <div className="lg:col-span-5 relative">
            <div className="relative h-[400px] md:h-[500px] overflow-hidden rounded-lg shadow-2xl">
              <Image
                src={aboutImageUrl}
                alt={`About ${company.name}`}
                fill
                className="object-cover"
              />
              <div className="absolute bottom-0 left-0 bg-red-600 text-white py-4 px-6 font-bold">
                TRUSTED BY THOUSANDS
              </div>
            </div>
            
            {/* Floating stats box */}
            <div className="absolute -bottom-10 -right-10 bg-blue-600 text-white p-8 rounded-lg shadow-xl hidden md:block">
              <div className="text-4xl font-black mb-2">25+</div>
              <div>Years of Excellence</div>
            </div>
          </div>
          
          {/* Content side - takes 7 columns on large screens */}
          <div className="lg:col-span-7">
            <h3 className="text-3xl font-bold mb-6 text-gray-900">
              About {company.name}
            </h3>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-xl leading-relaxed">
                {company.site_company_insights_description || 
                  `${company.name} has been delivering powerful heating and cooling solutions with bold, innovative approaches to home comfort. Our retro-inspired work ethic combined with cutting-edge technology creates the perfect balance of reliability and performance.`
                }
              </p>
              
              <p className="mb-8">
                We've built our reputation on strong values, quality craftsmanship, and a commitment to customer satisfaction. When you choose us, you're choosing a partner who stands behind their work.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="border-t-4 border-red-600 pt-4">
                <div className="font-bold text-xl mb-2">Quality Service</div>
                <p className="text-gray-600">Excellence in every job, large or small</p>
              </div>
              
              <div className="border-t-4 border-blue-600 pt-4">
                <div className="font-bold text-xl mb-2">Expert Team</div>
                <p className="text-gray-600">Certified professionals at your service</p>
              </div>
              
              <div className="border-t-4 border-gray-800 pt-4">
                <div className="font-bold text-xl mb-2">Customer Focus</div>
                <p className="text-gray-600">Your satisfaction is our priority</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;