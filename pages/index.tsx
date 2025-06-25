import { useState } from 'react';
import Head from 'next/head';

export default function HomePage() {
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    phone: '',
    smsConsent: false
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.smsConsent) {
      alert('Please agree to receive SMS updates to continue');
      return;
    }
    
    setIsSubmitted(true);
    
    // Send to your backend for contractor signup
    try {
      await fetch('/api/marketing/sms-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          timestamp: new Date().toISOString(),
          ipAddress: 'client-ip', // Would be captured server-side
          optInText: 'I agree to receive account and service updates by SMS from Atlas Growth. Message frequency may vary. Msg & Data rates may apply. Reply STOP to unsubscribe. Text HELP for support.'
        })
      });
    } catch (error) {
      console.error('Signup error:', error);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Atlas Growth!</h1>
            <p className="text-gray-600 text-lg mb-4">
              Your HVAC business account is being set up. You'll receive SMS confirmations and updates about your service setup.
            </p>
            <p className="text-gray-500 text-sm">
              Check your email for next steps and login instructions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Atlas Growth - Professional Platform Management for Contractors</title>
        <meta name="description" content="SaaS platform for licensed contractors and agency partners. Secure account management, onboarding support, and platform notifications." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="text-2xl font-bold text-gray-900">Atlas Growth</div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-gray-600 font-medium">HVAC Business Solutions</div>
                <a href="/admin/pipeline" className="text-sm text-gray-500 hover:text-gray-700 opacity-70 hover:opacity-100">
                  Admin
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="container mx-auto px-4 py-20">
            <div className="max-w-4xl mx-auto text-center">
              {/* Headline */}
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Complete Business Management for <span className="text-blue-600">HVAC Contractors</span>
              </h1>
              
              <h2 className="text-xl md:text-2xl text-gray-600 mb-8 font-medium max-w-3xl mx-auto">
                Streamline customer communications, manage leads, and grow your HVAC business with our comprehensive platform designed specifically for contractors.
              </h2>

              {/* Social Proof */}
              <div className="flex flex-wrap justify-center gap-8 mb-12">
                <div className="text-center bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="text-3xl font-bold text-blue-600">500+</div>
                  <div className="text-sm text-gray-600 font-medium">HVAC Contractors</div>
                </div>
                <div className="text-center bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="text-3xl font-bold text-green-600">24/7</div>
                  <div className="text-sm text-gray-600 font-medium">Customer Support</div>
                </div>
                <div className="text-center bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="text-3xl font-bold text-indigo-600">99.9%</div>
                  <div className="text-sm text-gray-600 font-medium">Uptime Guarantee</div>
                </div>
              </div>

              {/* Contractor Signup Form */}
              <div id="signup" className="max-w-xl mx-auto">
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Start Managing Your HVAC Business Today
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Join 500+ HVAC contractors who trust Atlas Growth to streamline their operations and grow their business.
                  </p>
                  
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <input
                      type="text"
                      placeholder="HVAC Company Name"
                      value={formData.companyName}
                      onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-900 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="email"
                      placeholder="Business Email Address"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-900 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="tel"
                      placeholder="Business Phone Number"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-900 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    
                    <div className="flex items-start space-x-3 mt-4">
                      <input
                        type="checkbox"
                        id="sms-consent"
                        checked={formData.smsConsent}
                        onChange={(e) => setFormData({...formData, smsConsent: e.target.checked})}
                        required
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="sms-consent" className="text-xs text-gray-600">
                        By signing up you agree to receive account and service updates by SMS from Atlas Growth. Message frequency may vary. Msg & Data rates may apply. Reply STOP to unsubscribe. Text HELP for support. See{' '}
                        <a href="/privacy" className="text-blue-600 underline hover:text-blue-700">Privacy Policy</a>
                        {' '}and{' '}
                        <a href="/terms" className="text-blue-600 underline hover:text-blue-700">Terms</a>.
                      </label>
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg text-lg transition-colors duration-200 shadow-md"
                    >
                      Get Started Free
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Everything Your HVAC Business Needs
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Our platform is specifically designed for HVAC contractors, with features that help you manage customers, track service requests, and grow your business.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="text-center p-8 rounded-2xl bg-gradient-to-b from-blue-50 to-white border border-blue-100">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Customer Management</h3>
                <p className="text-gray-600">
                  Keep track of all your customers, leads, and service history. Organize contacts by service type and track customer interactions seamlessly.
                </p>
              </div>
              
              <div className="text-center p-8 rounded-2xl bg-gradient-to-b from-green-50 to-white border border-green-100">
                <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Service Communication</h3>
                <p className="text-gray-600">
                  Handle all customer communications in one place. Manage service requests for repairs, installations, tune-ups, and emergency calls efficiently.
                </p>
              </div>
              
              <div className="text-center p-8 rounded-2xl bg-gradient-to-b from-indigo-50 to-white border border-indigo-100">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Business Growth</h3>
                <p className="text-gray-600">
                  Track your business performance, convert more leads to customers, and grow your HVAC company with data-driven insights and automation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                How Atlas Growth Works for HVAC Contractors
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Simple, powerful tools designed specifically for HVAC businesses to manage customers and grow revenue.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Capture Leads</h4>
                <p className="text-gray-600">Automatically capture and organize leads from your website, referrals, and service calls.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Manage Communications</h4>
                <p className="text-gray-600">Handle all customer messages, service requests, and follow-ups in one centralized dashboard.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Track Service Types</h4>
                <p className="text-gray-600">Organize work by service type: repairs, installations, tune-ups, and emergency calls.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">4</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Grow Your Business</h4>
                <p className="text-gray-600">Convert more leads to customers and scale your HVAC operations with automation.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Details */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6">
                  Streamlined HVAC Customer Management
                </h3>
                <p className="text-lg text-gray-600 mb-8">
                  Keep all your HVAC customers organized in one place. Track service history, manage communications, and never lose track of important customer details.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Lead & Customer Tracking</h4>
                      <p className="text-gray-600">Separate new leads from existing customers for better follow-up</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Service History</h4>
                      <p className="text-gray-600">Complete record of all services provided to each customer</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Contact Information</h4>
                      <p className="text-gray-600">Phone, email, and address details always at your fingertips</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">Recent Customers</h4>
                    <span className="text-sm text-gray-500">Live Data</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">John Smith</div>
                        <div className="text-sm text-gray-600">AC Repair • (555) 123-4567</div>
                      </div>
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">Emergency</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">Sarah Johnson</div>
                        <div className="text-sm text-gray-600">HVAC Install • (555) 987-6543</div>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Install</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">Mike Davis</div>
                        <div className="text-sm text-gray-600">Tune Up • (555) 456-7890</div>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Tune Up</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-blue-600">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Grow Your HVAC Business?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join hundreds of HVAC contractors who have streamlined their operations and increased revenue with Atlas Growth.
            </p>
            <a href="#signup" className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-bold rounded-lg text-lg hover:bg-gray-100 transition-colors">
              Start Your Free Trial
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="text-xl font-bold">Atlas Growth</div>
              </div>
              <p className="text-gray-300">&copy; 2025 Atlas Growth • Atlas Reach Solutions LLC</p>
              <p className="text-gray-400">1000 Lane Park Court, Mount Brook, Alabama 35223</p>
              <p className="text-gray-400">Contact: nicholas@atlasgrowth.ai | 205-500-5170</p>
              <div className="flex justify-center gap-6 mt-6 pt-6 border-t border-gray-700">
                <a href="/privacy" className="text-gray-400 hover:text-white underline transition-colors">Privacy Policy</a>
                <a href="/terms" className="text-gray-400 hover:text-white underline transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}