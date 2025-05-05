import React from 'react';
import { Company } from '@/types';

interface AboutProps {
  company: Company;
}

const About: React.FC<AboutProps> = ({ company }) => {
  return (
    <section id="about" className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center">About {company.name}</h2>
          
          <div className="bg-white shadow-md rounded-lg p-8">
            {company.description ? (
              <div dangerouslySetInnerHTML={{ __html: company.description }} />
            ) : (
              <div className="space-y-4">
                <p>
                  {company.name} is a trusted HVAC contractor serving {company.city}, {company.state} and surrounding areas. 
                  We specialize in providing high-quality heating, ventilation, and air conditioning services to ensure 
                  your comfort year-round.
                </p>
                <p>
                  With years of experience in the industry, our team of certified technicians is dedicated to delivering 
                  exceptional service, whether you need installation, maintenance, or repair for your HVAC systems.
                </p>
                <p>
                  We pride ourselves on our commitment to customer satisfaction, affordable pricing, and reliable solutions 
                  that keep your home or business comfortable in all seasons.
                </p>
              </div>
            )}
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-award">
                    <circle cx="12" cy="8" r="7"></circle>
                    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                  </svg>
                </div>
                <h3 className="font-bold mb-2">Experience</h3>
                <p className="text-sm text-gray-600">Years of industry expertise</p>
              </div>
              
              <div className="text-center">
                <div className="bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-users">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <h3 className="font-bold mb-2">Certified Team</h3>
                <p className="text-sm text-gray-600">Professional technicians</p>
              </div>
              
              <div className="text-center">
                <div className="bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-thumbs-up">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                  </svg>
                </div>
                <h3 className="font-bold mb-2">Customer Satisfaction</h3>
                <p className="text-sm text-gray-600">Quality service guaranteed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
