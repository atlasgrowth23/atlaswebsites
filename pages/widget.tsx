import React from 'react';
import Head from 'next/head';
import ChatWidget from '@/components/widget/ChatWidget';

export default function WidgetPage() {
  return (
    <div>
      <Head>
        <title>Chat Widget Demo | HVAC Website</title>
      </Head>
      
      <div className="max-w-6xl mx-auto p-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">HVAC Chat Widget Demo</h1>
          <p className="text-lg text-gray-600">
            Click the message icon in the bottom right corner to test the widget
          </p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Widget Features</h2>
            <ul className="space-y-2 list-disc pl-5">
              <li>Customizable company branding and colors</li>
              <li>Contact form with field validation</li>
              <li>Service type selection dropdown</li>
              <li>Responsive design for all devices</li>
              <li>Success confirmation screen</li>
              <li>Minimize/maximize functionality</li>
            </ul>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Backend Integration</h2>
            <ul className="space-y-2 list-disc pl-5">
              <li>Messages sent to HVAC company's dashboard</li>
              <li>Lead information captured in database</li>
              <li>Optional SMS notifications for new leads</li>
              <li>Email notification capabilities</li>
              <li>Custom webhook support</li>
            </ul>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-12">
          <h2 className="text-xl font-semibold mb-4">Implementation Example</h2>
          <div className="bg-gray-100 p-4 rounded-md">
            <pre className="text-sm overflow-x-auto">
{`// Add this script tag to your website
<script src="https://hvac-websites.com/widget.js" 
  data-company="your-company-slug"
  data-color="#0066FF"
  data-accent="#F6AD55">
</script>`}
            </pre>
          </div>
          <p className="mt-4 text-gray-600">
            Simply add the script tag above to your website, replacing the data attributes with your company information.
          </p>
        </div>
        
        <div className="text-center mb-36">
          <h2 className="text-2xl font-bold mb-4">Ready to add this to your website?</h2>
          <p className="max-w-2xl mx-auto mb-6">
            Contact us today to get your customized widget set up on your website and start capturing more leads immediately.
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md">
            Contact Sales
          </button>
        </div>
      </div>
      
      {/* The actual widget component */}
      <ChatWidget 
        companySlug="demo-company" 
        companyName="Demo HVAC Company"
        primaryColor="#0066FF"
        accentColor="#F6AD55"
      />
    </div>
  );
}