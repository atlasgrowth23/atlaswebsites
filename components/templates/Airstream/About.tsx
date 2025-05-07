import React from 'react';
import Image from 'next/image';
import { Shield, Clock, Users, Wrench } from 'lucide-react';
import { Company } from '@/types';
import { getCompanyColors } from '@/lib/palettes';
import { getPhotoUrl } from '@/lib/photo';

interface AboutProps {
  company: Company;
}

const About: React.FC<AboutProps> = ({ company }) => {
  // Get company colors
  const colors = getCompanyColors(company);

  // Get about image URL using the photo helper
  const aboutImageUrl = getPhotoUrl(company, 'about_img', 'airstream');

  // Features data
  const features = [
    {
      icon: <Shield size={36} className="text-primary" />,
      title: "Certified Professionals",
      description: "Our team consists of licensed and certified HVAC technicians with years of experience."
    },
    {
      icon: <Clock size={36} className="text-primary" />,
      title: "24/7 Emergency Service",
      description: "We're available around the clock to handle any HVAC emergencies that may arise."
    },
    {
      icon: <Users size={36} className="text-primary" />,
      title: "Customer Satisfaction",
      description: "Our top priority is ensuring our customers are completely satisfied with our work."
    },
    {
      icon: <Wrench size={36} className="text-primary" />,
      title: "Modern Equipment",
      description: "We use the latest technology and equipment to deliver superior HVAC solutions."
    }
  ];

  return (
    <section id="about" className="py-24 bg-white overflow-hidden" style={{
      // Use CSS variables for theming
      '--primary-color': colors.primary,
      '--secondary-color': colors.secondary
    } as React.CSSProperties}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            About <span className="text-primary">{company.name}</span>
          </h2>
          <div className="h-1 w-24 bg-secondary mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Image with decorative elements */}
          <div className="relative">
            <div className="relative z-10 rounded-lg overflow-hidden shadow-xl transform hover:scale-105 transition-transform duration-500">
              <div className="aspect-w-4 aspect-h-3 relative">
                <Image 
                  src={aboutImageUrl}
                  alt={`About ${company.name}`}
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-primary opacity-20 animate-pulse-slow"></div>
            <div className="absolute -top-6 -left-6 w-32 h-32 rounded-full border-4 border-secondary opacity-20"></div>

            {/* Experience badge */}
            {company.site_company_insights_founded_year && (
              <div className="absolute top-4 right-4 bg-white shadow-lg rounded-lg p-4 z-20">
                <div className="text-center">
                  <div className="text-xl font-bold text-primary">
                    {new Date().getFullYear() - company.site_company_insights_founded_year}+
                  </div>
                  <div className="text-sm text-gray-600">Years Experience</div>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div>
            <h3 className="text-2xl md:text-3xl font-bold mb-6">
              Your Comfort Is Our Priority
            </h3>

            <div className="prose prose-lg mb-8">
              <p>
                {company.site_company_insights_description || 
                  `At ${company.name}, we've built our reputation on providing exceptional HVAC services with integrity and expertise. Our mission is to ensure your home or business maintains the perfect climate year-round.`
                }
              </p>
              <p>
                We pride ourselves on our attention to detail, responsive customer service, and craftsmanship that stands the test of time.
              </p>
            </div>

            {/* Features grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-shadow">
                  <div className="mb-4" style={{ color: colors.primary }}>
                    {feature.icon}
                  </div>
                  <h4 className="text-xl font-bold mb-2">{feature.title}</h4>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;