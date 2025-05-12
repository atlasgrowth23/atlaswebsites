
import React from 'react';
import Image from 'next/image';
import { Company } from '@/types';
import { getPhotoUrl } from '@/lib/photo';

interface AboutProps {
  company: Company;
}

const About: React.FC<AboutProps> = ({ company }) => {
  // Get about image URL using the photo helper
  const aboutImage = getPhotoUrl(company, 'about_img', 'moderntrust');
  
  return (
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          About {company.name}
        </h2>
        <div className="w-16 h-1 bg-blue-600 mx-auto"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="relative h-64 md:h-full md:aspect-square">
          <Image 
            src={aboutImage || '/public/stock/moderntrust/about_img.svg'} 
            alt={`About ${company.name}`}
            fill
            className="object-cover rounded-lg shadow-lg"
          />
        </div>
        
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Our Commitment to Quality
          </h3>
          <p className="text-gray-700 mb-6">
            With over 35 years of experience, {company.name} has established a reputation for excellence in the HVAC industry. 
            We pride ourselves on delivering high-quality solutions that meet the unique needs of our customers.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-blue-100 rounded-full p-2 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Professional Expertise</h4>
                <p className="text-gray-700">Our team of certified technicians brings years of experience to every job.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-blue-100 rounded-full p-2 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Quality Equipment</h4>
                <p className="text-gray-700">We use only top-quality, energy-efficient equipment for all installations.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-blue-100 rounded-full p-2 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Customer Satisfaction</h4>
                <p className="text-gray-700">Your comfort is our priority. We're not satisfied until you are.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
