import { useState } from 'react';
import Head from 'next/head';

export default function MarketingPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Here you'd integrate with your email service (ConvertKit, Mailchimp, etc.)
    // For now, just show success
    setIsSubmitted(true);
    
    // Optional: Send to your backend
    try {
      await fetch('/api/marketing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
    } catch (error) {
      console.error('Subscription error:', error);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-white mb-4">You're In!</h1>
            <p className="text-blue-100 text-lg">
              Check your email for exclusive HVAC lead generation strategies that are making businesses $10K+ per month.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Atlas Growth - HVAC Lead Generation That Actually Works</title>
        <meta name="description" content="Generate high-quality HVAC leads that convert to $5K+ customers. Professional website templates, lead tracking, and proven systems used by successful HVAC businesses." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold text-white">Atlas Growth</div>
            <div className="text-blue-200">HVAC Lead Generation</div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Generate <span className="text-blue-400">$10K+</span> Monthly in HVAC Leads
            </h1>
            
            <h2 className="text-xl md:text-2xl text-blue-100 mb-8 font-medium">
              Professional websites + proven lead systems = HVAC businesses booking $5K+ customers every week
            </h2>

            {/* Social Proof */}
            <div className="flex flex-wrap justify-center gap-8 mb-12 text-blue-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">563</div>
                <div className="text-sm">Active Leads</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">$47K</div>
                <div className="text-sm">Generated This Month</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">94%</div>
                <div className="text-sm">Lead Quality</div>
              </div>
            </div>

            {/* Opt-in Form */}
            <div className="max-w-xl mx-auto">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Get The Exact System We Use
                </h3>
                <p className="text-blue-100 mb-6">
                  Free case study: How Arkansas HVAC companies are generating 40+ qualified leads per month
                </p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="w-full px-4 py-3 rounded-lg text-gray-900 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors duration-200"
                  >
                    Send Me The Free Case Study
                  </button>
                </form>
                
                <p className="text-xs text-blue-200 mt-4">
                  No spam. Unsubscribe anytime. Real results from real HVAC businesses.
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-8 mt-16">
              <div className="text-center">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-bold text-white mb-2">Targeted Lead Generation</h3>
                <p className="text-blue-200">
                  Professional websites that convert visitors into $5K+ HVAC customers
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-white mb-2">Complete Tracking</h3>
                <p className="text-blue-200">
                  See exactly which leads become customers and track your ROI
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-xl font-bold text-white mb-2">Proven Results</h3>
                <p className="text-blue-200">
                  Arkansas & Alabama HVAC businesses using this exact system
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 border-t border-white/20">
          <div className="text-center text-blue-200">
            <p>&copy; 2025 Atlas Growth. Helping HVAC businesses grow with proven lead generation.</p>
          </div>
        </footer>
      </div>
    </>
  );
}