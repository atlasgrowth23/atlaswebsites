import React from 'react';
import { Company } from '@/types';

interface AboutProps {
  company: Company;
}

const About: React.FC<AboutProps> = ({ company }) => {
  // Helper function to format location text
  const getLocationText = () => {
    if (company.city && company.state) return `${company.city}, ${company.state}`;
    if (company.city) return company.city;
    if (company.state) return company.state;
    return 'your area';
  };

  // Founded year display if available
  const foundedYear = company.site_company_insights_founded_year 
    ? `since ${company.site_company_insights_founded_year}` 
    : '';

  return (
    <section className="py-20 bg-gray-50" id="about">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800">About {company.name}</h2>
          <div className="w-20 h-1 bg-primary mx-auto mb-8 rounded-full"></div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {/* Left column - Company facts */}
            <div className="md:col-span-1 bg-primary/5 p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-4 text-primary">Company Facts</h3>
              <ul className="space-y-4">
                {company.site_company_insights_founded_year && (
                  <li className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Established in {company.site_company_insights_founded_year}</span>
                  </li>
                )}
                <li className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Serving {getLocationText()}</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Licensed & Insured Professionals</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Fast Response Times</span>
                </li>
              </ul>
            </div>
            
            {/* Right column - About description */}
            <div className="md:col-span-2">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Your Trusted HVAC Partner {foundedYear}</h3>
              <div className="space-y-4 text-gray-600">
                <p>
                  {company.site_company_insights_description || 
                    `At ${company.name}, we're committed to providing exceptional heating and cooling services to homes and businesses in ${getLocationText()}. We understand the importance of a comfortable indoor environment, and we work diligently to ensure your HVAC systems operate at peak efficiency.`
                  }
                </p>
                <p>
                  Our team of certified HVAC technicians brings expertise and dedication to every project. From routine maintenance to complex installations, we handle each job with professionalism and attention to detail.
                </p>
                <p>
                  We pride ourselves on transparent pricing, timely service, and lasting results. When you choose {company.name}, you're not just getting an HVAC contractor – you're gaining a long-term partner for all your comfort needs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;