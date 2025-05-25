import React from 'react';
import Image from 'next/image';
import { Company } from '@/types';
import { getPhotoUrl } from '@/lib/photo';

interface AboutProps {
  company: Company;
}

const About: React.FC<AboutProps> = ({ company }) => {
  const aboutImage = getPhotoUrl(company, 'about_img', 'boldenergy');

  return (
    <section id="about" className="py-20 bg-gradient-to-br from-orange-100 via-red-50 to-yellow-100">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6">
              <span className="text-orange-600">BOLD</span> EXPERIENCE,
              <br />
              <span className="text-red-600">PROVEN</span> RESULTS
            </h2>
            
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              When you need results that matter, {company?.name || 'our team'} delivers with bold action and unwavering commitment. We don't just meet expectations – we exceed them with powerful solutions built for success.
            </p>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="text-center p-4 bg-gradient-to-br from-orange-200 to-red-200 rounded-lg">
                <div className="text-3xl font-black text-orange-600">100%</div>
                <div className="text-sm font-bold text-gray-700">SATISFACTION</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-red-200 to-yellow-200 rounded-lg">
                <div className="text-3xl font-black text-red-600">24/7</div>
                <div className="text-sm font-bold text-gray-700">AVAILABILITY</div>
              </div>
            </div>

            {company?.phone && (
              <a 
                href={`tel:${company.phone}`}
                className="inline-block bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
              >
                🔥 GET BOLD RESULTS: {company.phone}
              </a>
            )}
          </div>
          
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
              <Image 
                src={aboutImage || '/stock/boldenergy/about_img.svg'}
                alt={`About ${company?.name || 'our company'}`}
                width={600}
                height={400}
                className="object-cover w-full h-[400px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-orange-600/20 to-transparent"></div>
            </div>
            
            {/* Bold accent elements */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center text-2xl">
              ⚡
            </div>
            <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-red-500 rounded-full flex items-center justify-center text-3xl text-white font-black">
              💪
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;