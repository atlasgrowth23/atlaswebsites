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
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg h-96 overflow-hidden shadow-lg">
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <span className="text-xl font-medium">Company Image</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent"></div>
            </div>
            <div className="absolute -bottom-6 -left-6 bg-gradient-to-r from-primary to-primary/90 text-white p-6 rounded-lg shadow-xl">
              <div className="text-3xl font-bold mb-1">{company.site_company_insights_founded_year ? new Date().getFullYear() - company.site_company_insights_founded_year : '15'}+</div>
              <div className="text-sm font-medium">Years of Excellence</div>
            </div>
            <div className="absolute -top-4 -right-4 bg-secondary/90 text-white py-2 px-4 rounded-full shadow-lg">
              <div className="text-sm font-bold">Certified Professionals</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;