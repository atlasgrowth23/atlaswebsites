
import React from 'react';
import { Company } from '@/types';

interface HeroProps {
  company: Company;
}

const Hero: React.FC<HeroProps> = ({ company }) => {
  return (
    <section className="bg-blue-500 text-white py-20">
      <div className="container mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">{company.name}</h1>
        <p className="text-xl mb-6">Professional HVAC Services</p>
        <button className="bg-white text-blue-500 px-6 py-2 rounded-lg">
          Contact Us
        </button>
      </div>
    </section>
  );
};

export default Hero;
