
import React from 'react';
import { Company } from '@/types';

interface OfferProps {
  company: Company;
}

const Offer: React.FC<OfferProps> = ({ company }) => {
  return (
    <section className="bg-blue-700 py-12">
      <div className="container mx-auto px-4">
        <div className="bg-blue-800 rounded-lg p-8 shadow-xl max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0 md:mr-6">
              <h2 className="text-3xl font-bold text-white mb-2">
                Special Limited-Time Offer
              </h2>
              <p className="text-blue-200 text-lg mb-4">
                $50 OFF Your First Service Call
              </p>
              <p className="text-white/80">
                Contact us today to schedule your appointment and mention this offer.
              </p>
            </div>
            
            <div className="shrink-0">
              {company.phone ? (
                <a 
                  href={`tel:${company.phone}`} 
                  className="inline-block bg-white hover:bg-gray-100 text-blue-800 font-bold py-4 px-8 rounded-md transition-colors text-lg"
                >
                  Call Now: {company.phone}
                </a>
              ) : (
                <a 
                  href="#contact" 
                  className="inline-block bg-white hover:bg-gray-100 text-blue-800 font-bold py-4 px-8 rounded-md transition-colors text-lg"
                >
                  Schedule Now
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Offer;
