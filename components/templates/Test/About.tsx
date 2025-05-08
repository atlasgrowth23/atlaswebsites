
import React from 'react';
import { Company } from '@/types';

interface AboutProps {
  company: Company;
}

const About: React.FC<AboutProps> = ({ company }) => {
  return (
    <section id="about" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">About Us</h2>
        <p className="text-lg text-center max-w-3xl mx-auto">
          {company.site_company_insights_description || 
          `${company.name} is a premier HVAC service provider dedicated to keeping your home comfortable.`}
        </p>
      </div>
    </section>
  );
};

export default About;
