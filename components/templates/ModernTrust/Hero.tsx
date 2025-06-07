import React, { useState } from 'react';
import Image from 'next/image';
import { Company } from '@/types';
import { getPhotoUrl } from '@/lib/photo';

interface HeroProps {
  company: Company;
}

const Hero: React.FC<HeroProps> = ({ company }) => {
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Single hero configuration
  const heroConfig = {
    image: getPhotoUrl(company, 'hero_img', 'moderntrust'),
    title: `Professional HVAC Service in`,
    subtitle: (company as any).display_city || company.city || 'Your Area',
    description: "Licensed technicians providing reliable heating and cooling solutions for your home and business."
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteForm.name.trim() || !quoteForm.phone.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/chat/create-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: company.id,
          visitorId: `hero_${Date.now()}`,
          conversationId: null,
          name: quoteForm.name.trim(),
          email: quoteForm.email.trim() || undefined,
          phone: quoteForm.phone.trim()
        })
      });

      if (response.ok) {
        // Also send a message to the conversation
        await fetch('/api/chat/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `Quote request from hero form: ${quoteForm.service ? `Service: ${quoteForm.service}. ` : ''}${quoteForm.message ? `Message: ${quoteForm.message}` : 'General quote request.'}`,
            companyId: company.id,
            visitorId: `hero_${Date.now()}`,
            conversationId: null,
            companyName: company.name,
            response: 'Thank you for your quote request! We will contact you soon with pricing information.'
          })
        });

        setQuoteForm({ name: '', email: '', phone: '', service: '', message: '' });
        setShowQuoteForm(false);
        alert('Thank you! We\'ll contact you soon with your free quote.');
      } else {
        throw new Error('Failed to submit quote request');
      }
    } catch (error) {
      console.error('Error submitting quote:', error);
      alert('Sorry, there was an error. Please try calling us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                onClick={() => setShowQuoteForm(true)}
                className="border-2 border-white bg-white/10 backdrop-blur-md text-white hover:bg-white hover:text-gray-900 px-8 py-4 rounded-xl text-lg font-bold transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-center">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Get Free Quote
                </div>
              </button>
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

          {/* Right Column - Additional Content Space */}
          <div className="hidden lg:block">
            {/* This space could be used for additional content like service highlights, certifications, or testimonials */}
          </div>
        </div>
      </div>

      {/* Quote Form Modal */}
      {showQuoteForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto transform animate-in slide-in-from-bottom-4 duration-500">
            {/* Header with Company Branding */}
            <div className="relative p-8 bg-gradient-to-br from-red-600 via-red-500 to-orange-500 rounded-t-3xl">
              <div className="absolute inset-0 bg-black/10 rounded-t-3xl"></div>
              <div className="relative flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">Get Your Free Quote from {company.name}</h3>
                  <p className="text-red-100 text-base">Quick response guaranteed • No obligation</p>
                  <div className="flex items-center space-x-2 mt-3">
                    <div className="flex items-center space-x-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                      <svg className="w-4 h-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-white text-sm font-medium">Licensed & Insured</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowQuoteForm(false)}
                  className="text-red-100 hover:text-white transition-colors p-2 rounded-full hover:bg-white/20 backdrop-blur-sm"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleQuoteSubmit} className="p-8">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={quoteForm.name}
                      onChange={(e) => setQuoteForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 hover:border-gray-300"
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={quoteForm.phone}
                      onChange={(e) => setQuoteForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 hover:border-gray-300"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">Email Address</label>
                  <input
                    type="email"
                    value={quoteForm.email}
                    onChange={(e) => setQuoteForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 hover:border-gray-300"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">Service Needed</label>
                  <select
                    value={quoteForm.service}
                    onChange={(e) => setQuoteForm(prev => ({ ...prev, service: e.target.value }))}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 hover:border-gray-300 bg-white"
                  >
                    <option value="">Select a service</option>
                    <option value="ac-repair">AC Repair & Service</option>
                    <option value="heating-repair">Heating Repair & Service</option>
                    <option value="installation">New System Installation</option>
                    <option value="maintenance">Preventive Maintenance</option>
                    <option value="emergency">Emergency Service</option>
                    <option value="duct-cleaning">Duct Cleaning</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">Tell Us About Your Needs</label>
                  <textarea
                    value={quoteForm.message}
                    onChange={(e) => setQuoteForm(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 hover:border-gray-300 resize-none"
                    placeholder="Describe your HVAC needs, any issues you're experiencing, or questions you have..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setShowQuoteForm(false)}
                  className="px-6 py-3 text-base font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !quoteForm.name.trim() || !quoteForm.phone.trim()}
                  className="flex-1 px-6 py-4 text-base font-bold text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-xl hover:shadow-red-500/30 flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Sending Quote Request...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Get My Free Quote</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  By submitting this form, you agree to be contacted by our team. 
                  <br />
                  <span className="font-semibold text-gray-800">We respect your privacy and never share your information.</span>
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hero;