import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { Company } from '@/types';
import { getPhotoUrl } from '@/lib/photo';

interface AboutProps {
  company: Company;
}

const About: React.FC<AboutProps> = ({ company }) => {
  // Get about image URL using the photo helper
  const aboutImage = getPhotoUrl(company, 'about_img', 'boldenergy');
  
  // Refs for animated elements
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const featureRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  
  // Scroll animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      { threshold: 0.1 }
    );
    
    // Observe elements
    if (sectionRef.current) observer.observe(sectionRef.current);
    if (imageRef.current) observer.observe(imageRef.current);
    if (contentRef.current) observer.observe(contentRef.current);
    featureRefs.forEach(ref => {
      if (ref.current) observer.observe(ref.current);
    });
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  return (
    <section 
      id="about" 
      ref={sectionRef}
      className="py-20 bg-gradient-to-br from-orange-100 via-red-50 to-yellow-100 opacity-0 transition-opacity duration-1000"
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div ref={contentRef} className="lg:order-1 opacity-0 transition-all duration-1000 transform translate-y-8">
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6">
              <span className="text-orange-600">Expert</span> HVAC Solutions<br />
              <span className="text-red-600">Built for Comfort</span>
            </h2>
            
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              At {company?.name || 'our company'}, we understand that your home's comfort is more than just temperature control. 
              It's about creating the perfect environment for your family to thrive, no matter what the weather brings.
            </p>
            
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              Our certified technicians bring years of experience and cutting-edge solutions to ensure your HVAC system operates at peak efficiency, 
              keeping you comfortable while saving money on energy costs.
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div ref={featureRefs[0]} className="text-center p-4 bg-gradient-to-br from-orange-200 to-red-200 rounded-lg opacity-0 transition-all duration-1000 transform translate-y-4">
                <div className="text-3xl font-black text-orange-600">25+</div>
                <div className="text-sm font-bold text-gray-700">YEARS EXPERIENCE</div>
              </div>
              
              <div ref={featureRefs[1]} className="text-center p-4 bg-gradient-to-br from-red-200 to-yellow-200 rounded-lg opacity-0 transition-all duration-1000 transform translate-y-4 delay-150">
                <div className="text-3xl font-black text-red-600">100%</div>
                <div className="text-sm font-bold text-gray-700">SATISFACTION</div>
              </div>
              
              <div ref={featureRefs[2]} className="text-center p-4 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-lg opacity-0 transition-all duration-1000 transform translate-y-4 delay-300">
                <div className="text-3xl font-black text-yellow-600">24/7</div>
                <div className="text-sm font-bold text-gray-700">EMERGENCY</div>
              </div>
            </div>

            {/* CTA */}
            {company?.phone && (
              <a 
                href={`tel:${company.phone}`}
                className="inline-block bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
              >
                📞 Call {company.phone}
              </a>
            )}
          </div>
          
          {/* Image */}
          <div ref={imageRef} className="lg:order-2 opacity-0 transition-all duration-1000 transform translate-x-8">
            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
              <Image 
                src={aboutImage || '/stock/boldenergy/about_img.svg'}
                alt={`About ${company?.name || 'our company'}`}
                width={600}
                height={400}
                className="object-cover w-full h-[400px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-orange-600/20 to-transparent"></div>
              
              {/* Company logo overlay if available */}
              {company?.logoUrl && (
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                  <Image 
                    src={company.logoUrl}
                    alt={`${company.name} logo`}
                    width={80}
                    height={50}
                    className="object-contain max-w-[80px] max-h-[50px]"
                  />
                </div>
              )}
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center text-2xl z-10">
              ⚡
            </div>
            <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-red-500 rounded-full flex items-center justify-center text-3xl text-white font-black z-10">
              🔥
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;