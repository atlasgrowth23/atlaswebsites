import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Atlas Growth</span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <div className="relative group">
                <button className="text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1">
                  Services
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <a href="/services/website-lead-generation" className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      Website + Lead Generation
                    </a>
                    <a href="/services/reputation-management" className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      Reputation Management
                    </a>
                    <a href="/services/customer-retention" className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      Customer Retention
                    </a>
                  </div>
                </div>
              </div>
              <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors">Contact</a>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                Get Started
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0">
          <Image 
            src="/images/hvac-hero-bg.jpg" 
            alt="HVAC contractor working"
            fill
            className="object-cover object-center"
            priority
            quality={90}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-blue-900/70 to-gray-900/80"></div>
        </div>

        <div className="container mx-auto px-4 z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
              Grow Your HVAC Business with 
              <span className="text-blue-400 block">Proven Marketing Systems</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/95 leading-relaxed max-w-3xl mx-auto">
              We help HVAC contractors get more customers, increase revenue, and automate their operations
            </p>

            <div className="flex justify-center pt-8">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-8 py-6 text-xl font-bold h-auto"
              >
                Get Your Free Website Analysis
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Complete Growth Solutions for HVAC Contractors
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From professional websites to automated operations, we provide everything you need to grow your HVAC business
            </p>
          </div>

          <div className="space-y-20">
            {/* Service 1: Professional Website + Lead Generation */}
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="lg:w-1/2">
                <div className="relative rounded-lg overflow-hidden aspect-[4/3] shadow-xl">
                  <Image 
                    src="/images/hvac-hero-bg.jpg" 
                    alt="Professional HVAC website design"
                    fill
                    className="object-cover"
                    quality={90}
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/80 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="text-sm font-medium opacity-90">Professional Website Example</div>
                  </div>
                </div>
              </div>
              
              <div className="lg:w-1/2 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900">Professional Website + Lead Generation</h3>
                    <p className="text-blue-600 font-medium">Start Here</p>
                  </div>
                </div>
                
                <p className="text-lg text-gray-700">
                  Your website is your digital storefront. We create professional, mobile-optimized websites that convert visitors into customers and dominate local search results with proven SEO and advertising strategies.
                </p>
                
                <div className="flex gap-4">
                  <Button 
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    asChild
                  >
                    <a href="/services/website-lead-generation">Learn More</a>
                  </Button>
                </div>
              </div>
            </div>

            {/* Service 2: Reputation Management */}
            <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
              <div className="lg:w-1/2">
                <div className="relative rounded-lg overflow-hidden aspect-[4/3] shadow-xl">
                  <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 h-full flex items-center justify-center">
                    <div className="text-center text-white p-8">
                      <div className="flex justify-center mb-4">
                        {[1,2,3,4,5].map(i => (
                          <svg key={i} className="w-12 h-12 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                          </svg>
                        ))}
                      </div>
                      <div className="text-4xl font-bold mb-2">4.9/5</div>
                      <div className="text-lg opacity-90">Average Rating</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="lg:w-1/2 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900">5-Star Reputation Management</h3>
                    <p className="text-yellow-600 font-medium">Automated Review System</p>
                  </div>
                </div>
                
                <p className="text-lg text-gray-700">
                  We guarantee more 5-star reviews. Our automated system ensures happy customers leave reviews while filtering out potential negative feedback before it goes public using our smart survey technology.
                </p>
                
                <div className="flex gap-4">
                  <Button 
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    asChild
                  >
                    <a href="/services/reputation-management">Learn More</a>
                  </Button>
                </div>
              </div>
            </div>

            {/* Service 3: Customer Retention + Business Operations */}
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="lg:w-1/2">
                <div className="relative rounded-lg overflow-hidden aspect-[4/3] shadow-xl bg-gradient-to-br from-blue-600 to-blue-500">
                  <div className="h-full flex items-center justify-center p-8">
                    <div className="text-center text-white">
                      <div className="text-4xl font-bold mb-4">🔄</div>
                      <h4 className="text-2xl font-bold mb-2">Automated Systems</h4>
                      <p className="text-blue-100">Keep customers coming back with maintenance plans and automated follow-ups</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="lg:w-1/2 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900">Customer Retention + Operations</h3>
                    <p className="text-gray-600 font-medium">Automated Business Systems</p>
                  </div>
                </div>
                
                <p className="text-lg text-gray-700">
                  Turn one-time customers into lifelong clients. Our automated systems track equipment, schedule maintenance, and keep customers coming back year after year with powerful retention and operational tools.
                </p>
                
                <div className="flex gap-4">
                  <Button 
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    asChild
                  >
                    <a href="/services/customer-retention">Learn More</a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              What HVAC Contractors Are Saying
            </h2>
            <p className="text-xl text-gray-600">
              Real results from real contractors who've transformed their businesses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  M
                </div>
                <div className="ml-4">
                  <h4 className="font-bold text-gray-900">Mike Thompson</h4>
                  <p className="text-gray-600">Thompson HVAC</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                "Atlas Growth transformed our business. We went from 2-3 calls a week to 15-20 qualified leads. Our revenue increased by 180% in just 8 months."
              </p>
              <div className="flex text-yellow-400">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  </svg>
                ))}
              </div>
            </Card>

            <Card className="p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  S
                </div>
                <div className="ml-4">
                  <h4 className="font-bold text-gray-900">Sarah Johnson</h4>
                  <p className="text-gray-600">Comfort Pro Services</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                "The review automation alone saved us 10 hours a week. Our Google rating went from 3.8 to 4.9 stars, and we're booking way more maintenance contracts."
              </p>
              <div className="flex text-yellow-400">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  </svg>
                ))}
              </div>
            </Card>

            <Card className="p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  R
                </div>
                <div className="ml-4">
                  <h4 className="font-bold text-gray-900">Robert Martinez</h4>
                  <p className="text-gray-600">Elite Air Solutions</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                "Finally, a marketing company that understands HVAC. They set up everything - website, ads, follow-up sequences. I can focus on running jobs while they handle marketing."
              </p>
              <div className="flex text-yellow-400">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  </svg>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Why HVAC Contractors Choose Atlas Growth
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              We're not just another marketing agency - we're HVAC industry specialists
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4">Industry Expertise</h3>
              <p className="text-gray-300">
                We only work with HVAC contractors. We understand your business, your customers, and your challenges.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4">Proven ROI Results</h3>
              <p className="text-gray-300">
                Our clients see an average 3:1 return on investment within the first 6 months.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4">Done-For-You Implementation</h3>
              <p className="text-gray-300">
                We handle everything from setup to optimization. You focus on running your business.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4">Ongoing Support</h3>
              <p className="text-gray-300">
                Dedicated account management and continuous optimization to maximize your results.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20 bg-gradient-to-r from-blue-600 to-blue-500">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Grow Your HVAC Business?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Get a free website analysis and discover opportunities to increase your revenue by 50% or more.
            </p>
            
            <div className="bg-white rounded-2xl p-8 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Get Your Free Website Analysis</h3>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    placeholder="Your Name" 
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input 
                    type="text" 
                    placeholder="Company Name" 
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input 
                    type="tel" 
                    placeholder="Phone Number" 
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <input 
                  type="url" 
                  placeholder="Current Website (if you have one)" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <textarea 
                  placeholder="What's your biggest marketing challenge right now?"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                ></textarea>
                <Button 
                  type="submit"
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-xl font-bold"
                >
                  Get My Free Website Analysis
                </Button>
              </form>
              <p className="text-sm text-gray-600 mt-4">
                No spam. We'll call within 24 hours with your personalized growth plan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">Atlas Growth</h3>
              <p className="text-gray-300 mb-6 max-w-md">
                The only marketing agency exclusively focused on helping HVAC contractors grow their businesses.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white">Lead Generation</a></li>
                <li><a href="#" className="hover:text-white">Review Management</a></li>
                <li><a href="#" className="hover:text-white">Marketing Automation</a></li>
                <li><a href="#" className="hover:text-white">Business Operations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-300">
                <li>📧 hello@atlasgrowth.com</li>
                <li>📱 (555) 123-4567</li>
                <li>🕒 Mon-Fri 9AM-6PM EST</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Atlas Growth. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}