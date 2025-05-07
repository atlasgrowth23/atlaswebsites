import React from 'react';
import Image from 'next/image';
import { Company } from '@/types';
import { getPhotoUrl } from '@/lib/photo';

interface AboutProps {
  company: Company;
}

const About: React.FC<AboutProps> = ({ company }) => {
  // Get about image URL using the photo helper
  const aboutImageUrl = getPhotoUrl(company, 'about_img', 'moderntrust');
  
  return (
    <section className="py-20 bg-gray-50" id="about">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Image side */}
            <div className="relative h-[400px] md:h-[500px] rounded-xl overflow-hidden shadow-xl">
              <Image
                src={aboutImageUrl}
                alt={`About ${company.name}`}
                fill
                className="object-cover"
              />
            </div>
            
            {/* Content side */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-blue-900">
                About {company.name}
              </h2>
              
              <div className="mb-8 h-1 w-20 bg-blue-500"></div>
              
              <div className="prose prose-lg max-w-none">
                <p>
                  {company.site_company_insights_description || 
                    `${company.name} is a leading provider of modern heating, cooling, and air quality solutions. 
                    We're committed to delivering comfort and efficiency to homes and businesses.`
                  }
                </p>
                
                <p>
                  With a focus on cutting-edge technology and exceptional service, our team of certified 
                  technicians ensures your HVAC systems operate at peak performance year-round.
                </p>
                
                {company.site_company_insights_founded_year && (
                  <p>
                    Since our founding in {company.site_company_insights_founded_year}, we've built our reputation 
                    on reliability, integrity, and customer satisfaction.
                  </p>
                )}
              </div>
              
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <div className="font-bold text-blue-900 text-xl mb-1">Professional Team</div>
                  <p className="text-gray-600">Certified technicians with years of experience</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <div className="font-bold text-blue-900 text-xl mb-1">Quality Service</div>
                  <p className="text-gray-600">Premium solutions tailored to your needs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;