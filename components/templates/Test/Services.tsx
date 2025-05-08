
import React from 'react';
import { Company } from '@/types';

interface ServicesProps {
  company: Company;
}

const Services: React.FC<ServicesProps> = ({ company }) => {
  return (
    <section id="services" className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 shadow-md rounded-lg">
            <h3 className="text-xl font-bold mb-3">Heating</h3>
            <p>Professional heating installation and repair services.</p>
          </div>
          <div className="p-6 shadow-md rounded-lg">
            <h3 className="text-xl font-bold mb-3">Cooling</h3>
            <p>Expert air conditioning solutions for your comfort.</p>
          </div>
          <div className="p-6 shadow-md rounded-lg">
            <h3 className="text-xl font-bold mb-3">Maintenance</h3>
            <p>Regular maintenance to keep your systems efficient.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
