import React, { useState } from 'react';
import Image from 'next/image';
import { Company } from '@/types';
import { getPhotoUrl } from '@/lib/photo';

interface HeroProps {
  company: Company;
}

const Hero: React.FC<HeroProps> = ({ company }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('/api/contact-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          companyName: company.name,
          companySlug: company.slug
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', phone: '', email: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hero configuration - customizable per company
  const getHeroConfig = (company: Company) => {
    // Custom headlines for specific companies
    if (company.custom_domain === 'accuracyheatair.com' || company.slug === 'accuracy-heat-air-llc') {
      return {
        image: getPhotoUrl(company, 'hero_img', 'moderntrust'),
        title: "If It's Not Right The First Time,",
        subtitle: "It's Not Accuracy",
        description: "Licensed HVAC technicians providing reliable heating and cooling solutions with guaranteed accuracy."
      };
    }
    
    // Default configuration for all other companies
    return {
      image: getPhotoUrl(company, 'hero_img', 'moderntrust'),
      title: `Professional HVAC Service in`,
      subtitle: (company as any).display_city || company.city || 'Your Area',
      description: "Licensed technicians providing reliable heating and cooling solutions for your home and business."
    };
  };

  const heroConfig = getHeroConfig(company);

  return (
    <div className="relative min-h-[85vh] lg:min-h-[calc(100vh-80px)] flex items-center overflow-hidden">
      {/* Single Hero Background */}
      <div className="absolute inset-0">
        {heroConfig.image && (
          <Image 
            src={heroConfig.image} 
            alt={`Professional HVAC services by ${company?.name || 'our company'}`}
            fill
            className="object-cover object-center"
            priority
            quality={90}
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70"></div>
      </div>

      {/* Hero Content - Improved positioning and layout */}
      <div className="container mx-auto px-4 z-10 py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[60vh]">
          
          {/* Left Column - Main Content */}
          <div className="text-center lg:text-left space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight">
                <span className="block">{heroConfig.title}</span> 
                <span className="text-red-400 drop-shadow-lg">{heroConfig.subtitle}</span>
              </h1>

              <p className="text-xl lg:text-2xl text-white/95 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
                {heroConfig.description}
              </p>
            </div>

            {/* Action Buttons - Improved layout */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {company.phone && (
                <a 
                  href={`tel:${company.phone}`}
                  className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/30 transform hover:-translate-y-1 flex items-center justify-center group border-2 border-red-500/30"
                >
                  <svg className="h-6 w-6 mr-3 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <div className="text-lg">{company.phone}</div>
                    <div className="text-sm opacity-90">Call Now - Free Estimate</div>
                  </div>
                </a>
              )}

              <button 
                onClick={() => {
                  // Scroll to bottom to make chat widget visible
                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                  // Small delay then trigger chat widget
                  setTimeout(() => {
                    const chatButton = document.querySelector('[aria-label="Open chat"]') as HTMLButtonElement;
                    if (chatButton) {
                      chatButton.click();
                    }
                  }, 500);
                }}
                className="border-2 border-white bg-white/10 backdrop-blur-md text-white hover:bg-white hover:text-gray-900 px-8 py-4 rounded-xl text-lg font-bold transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-center">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Start Chat - Get Quote
                </div>
              </button>

              <a 
                href={`/hvac/login?company=${company.slug}&auto=true`}
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/30 transform hover:-translate-y-1 flex items-center justify-center group border-2 border-blue-500/30"
              >
                <svg className="h-5 w-5 mr-2 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Try Your HVAC Software
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4">
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white font-medium">Licensed & Insured</span>
              </div>
              {(company as any).emergency_service && (
                <div className="flex items-center space-x-2 bg-red-500/20 backdrop-blur-sm px-4 py-2 rounded-full border border-red-400/30">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-white font-medium">24/7 Emergency</span>
                </div>
              )}
              {(company as any).rating && parseFloat((company as any).rating) >= 4.5 && (
                <div className="flex items-center space-x-2 bg-yellow-500/20 backdrop-blur-sm px-4 py-2 rounded-full border border-yellow-400/30">
                  <div className="text-yellow-400 flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-white font-medium">{Number((company as any).rating).toFixed(1)} Stars</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <div className="lg:flex lg:justify-end">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl max-w-md w-full mx-auto lg:mx-0">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Get Free Estimate</h3>
                <p className="text-gray-600">Fill out the form and we'll text you back quickly!</p>
              </div>

              {submitStatus === 'success' && (
                <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                  Thank you! We'll text you back shortly.
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  Sorry, there was an error. Please try again or call us directly.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    name="name"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Your Phone Number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Your Email (Optional)"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <textarea
                    name="message"
                    placeholder="Tell us about your HVAC needs..."
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </div>
                  ) : (
                    'Get Free Estimate'
                  )}
                </button>
              </form>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">
                  Or call us directly: 
                  <a href={`tel:${company.phone}`} className="text-red-600 font-semibold ml-1 hover:underline">
                    {company.phone}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Hero;