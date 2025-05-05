import React from 'react';
import { Company } from '@/types';
import { Button } from '@/components/ui/button';

interface HeroProps {
  company: Company;
}

const Hero: React.FC<HeroProps> = ({ company }) => {
  return (
    <div className="bg-slate-100 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Expert HVAC Services in {company.city}, {company.state}
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Reliable heating, ventilation, and air conditioning solutions for residential and commercial properties.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2">
              <a href="#contact">Contact Us Today</a>
            </Button>
            <Button variant="outline" className="border-slate-800 text-slate-800 px-6 py-2">
              <a href="#services">Our Services</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
