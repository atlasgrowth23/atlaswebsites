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
      className="py-20 bg-white opacity-0 transition-opacity duration-1000"
    >
      <div className="container mx-auto px-6">
        {/* Company-specific heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
          <span className="text-orange-600">About</span> <span className="text-gray-900">{company.name}</span>
        </h2>
        
        {/* Main content - clean two column layout */}
        <div className="flex flex-col md:flex-row md:items-center md:space-x-10">
          
          {/* Left column - Image with animation */}
          <div 
            ref={imageRef}
            className="md:w-1/2 mb-10 md:mb-0 opacity-0 translate-x-[-20px] transition-all duration-1000 delay-300"
          >
            <div className="relative rounded-lg overflow-hidden aspect-[4/3] shadow-lg">
              <Image 
                src={aboutImage || '/stock/boldenergy/about_img.svg'} 
                alt={`${company.name} services`}
                fill
                className="object-cover"
              />
            </div>
          </div>
          
          {/* Right column - Text content with animations */}
          <div 
            ref={contentRef}
            className="md:w-1/2 opacity-0 translate-x-[20px] transition-all duration-1000 delay-300"
          >
            <p className="text-lg text-gray-700 mb-8">
              We provide quality heating and cooling services to keep your home comfortable all year round. Our experienced team is dedicated to delivering reliable solutions tailored to your needs.
            </p>
            
            {/* Three simple feature blocks with staggered animations */}
            <div className="space-y-8">
              <div 
                ref={featureRefs[0]}
                className="flex items-start opacity-0 translate-y-[10px] transition-all duration-700 delay-500"
              >
                <div className="flex-shrink-0 mr-4">
                  <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center transform transition-transform hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Rapid Response</h3>
                  <p className="text-gray-600">Quick service when you need it most, with same-day appointments available for urgent needs.</p>
                </div>
              </div>
              
              <div 
                ref={featureRefs[1]}
                className="flex items-start opacity-0 translate-y-[10px] transition-all duration-700 delay-700"
              >
                <div className="flex-shrink-0 mr-4">
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center transform transition-transform hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Certified Experts</h3>
                  <p className="text-gray-600">Professional technicians with the training and expertise to solve any HVAC challenge.</p>
                </div>
              </div>
              
              <div 
                ref={featureRefs[2]}
                className="flex items-start opacity-0 translate-y-[10px] transition-all duration-700 delay-900"
              >
                <div className="flex-shrink-0 mr-4">
                  <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center transform transition-transform hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Always Available</h3>
                  <p className="text-gray-600">Emergency services available 24/7 because HVAC problems don't wait for business hours.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add the fade-in animation style */}
      <style jsx>{`
        .animate-fade-in {
          opacity: 1 !important;
          transform: translateX(0) translateY(0) !important;
        }
      `}</style>
    </section>
  );
};

export default About;