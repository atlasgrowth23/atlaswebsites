import React from 'react';
import { Company } from '@/types';

interface AboutProps {
  company: Company;
}

const About: React.FC<AboutProps> = ({ company }) => {
  return (
    <section className="py-16" id="about">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">About {company.name}</h2>
            <p className="text-gray-600 mb-4">
              {company.site_company_insights_description || 
                `We are a trusted HVAC service provider${company.city ? ` serving ${company.city}` : ''}${company.state ? `, ${company.state}` : ''} and surrounding areas. 
                With years of experience in the industry, we've built our reputation on quality workmanship, 
                reliable service, and customer satisfaction.`
              }
            </p>
            <p className="text-gray-600 mb-4">
              Our team of certified HVAC technicians are dedicated to providing prompt, professional service 
              for all your heating, cooling, and ventilation needs. Whether you need a new system installation, 
              emergency repairs, or regular maintenance, we have the skills and experience to get the job done right.
            </p>
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-3">Why Choose Us?</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Licensed and insured professionals</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Upfront pricing with no hidden fees</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Prompt, reliable service</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Satisfaction guaranteed</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="relative">
            <div className="bg-gray-200 rounded-lg h-96 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <span>Company Image</span>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 bg-primary text-white p-6 rounded-lg shadow-lg">
              <div className="text-2xl font-bold mb-1">15+</div>
              <div className="text-sm">Years of Experience</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;