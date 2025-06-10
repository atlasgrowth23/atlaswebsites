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
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
            <div className="text-6xl mb-4">🚀</div>
            <h1 className="text-3xl font-bold text-white mb-4">Welcome to Atlas Growth!</h1>
            <p className="text-blue-100 text-lg">
              Your account is being set up. You'll receive SMS confirmations and updates about your service setup.
            </p>
            <p className="text-blue-200 text-sm mt-4">
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

      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold text-white">Atlas Growth</div>
            <div className="flex items-center gap-4">
              <div className="text-blue-200">Business Growth Solutions</div>
              <a href="/admin/pipeline" className="text-xs text-blue-300 hover:text-white opacity-50 hover:opacity-100">
                Admin
              </a>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Professional <span className="text-blue-400">Platform Management</span> for Contractors
            </h1>
            
            <h2 className="text-xl md:text-2xl text-blue-100 mb-8 font-medium">
              SaaS platform for licensed contractors and agency partners • Account management • Platform support
            </h2>

            {/* Social Proof */}
            <div className="flex flex-wrap justify-center gap-8 mb-12 text-blue-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">500+</div>
                <div className="text-sm">Contractors Served</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="text-sm">Platform Support</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">Secure</div>
                <div className="text-sm">Account Management</div>
              </div>
            </div>

            {/* Contractor Signup Form */}
            <div className="max-w-xl mx-auto">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Access Your Platform Account
                </h3>
                <p className="text-blue-100 mb-6">
                  Join 500+ contractors using Atlas Growth platform for professional account management
                </p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Company Name"
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    required
                    className="w-full px-4 py-3 rounded-lg text-gray-900 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <input
                    type="email"
                    placeholder="Business Email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    className="w-full px-4 py-3 rounded-lg text-gray-900 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <input
                    type="tel"
                    placeholder="Business Phone Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                    className="w-full px-4 py-3 rounded-lg text-gray-900 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                    <label htmlFor="sms-consent" className="text-xs text-blue-200">
                      By signing up you agree to receive account and service updates by SMS from Atlas Growth. Message frequency may vary. Msg & Data rates may apply. Reply STOP to unsubscribe. Text HELP for support. See{' '}
                      <a href="/privacy" className="text-blue-300 underline hover:text-white">Privacy Policy</a>
                      {' '}and{' '}
                      <a href="/terms" className="text-blue-300 underline hover:text-white">Terms</a>.
                    </label>
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors duration-200"
                  >
                    Create Account
                  </button>
                </form>
              </div>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-8 mt-16">
              <div className="text-center">
                <div className="text-4xl mb-4">🔐</div>
                <h3 className="text-xl font-bold text-white mb-2">Secure Account Management</h3>
                <p className="text-blue-200">
                  Professional platform access with secure login and account protection
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-4xl mb-4">📱</div>
                <h3 className="text-xl font-bold text-white mb-2">SMS Notifications</h3>
                <p className="text-blue-200">
                  Receive important account updates, security alerts, and platform notifications
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-4xl mb-4">🛠️</div>
                <h3 className="text-xl font-bold text-white mb-2">Platform Support</h3>
                <p className="text-blue-200">
                  Get onboarding assistance and technical support for your Atlas Growth account
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 border-t border-white/20">
          <div className="text-center text-blue-200 space-y-2">
            <p>&copy; 2025 Atlas Growth • Atlas Reach Solutions LLC</p>
            <p>1000 Lane Park Court, Mount Brook, Alabama 35223</p>
            <p>Contact: nicholas@atlasgrowth.ai | 205-500-5170</p>
            <div className="flex justify-center gap-4 mt-4">
              <a href="/privacy" className="text-blue-300 hover:text-white underline">Privacy Policy</a>
              <a href="/terms" className="text-blue-300 hover:text-white underline">Terms of Service</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}