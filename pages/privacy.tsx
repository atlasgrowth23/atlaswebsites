import React from 'react';
import Head from 'next/head';

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy | Atlas Growth</title>
        <meta name="description" content="Atlas Growth Privacy Policy and SMS messaging terms" />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
            
            <div className="prose max-w-none">
              <p className="text-sm text-gray-600 mb-6">
                Last updated: {new Date().toLocaleDateString()}
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
                <p className="mb-4">
                  Atlas Growth collects information you provide when booking services through our partner contractors' websites, including:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Name and contact information (phone number, email address)</li>
                  <li>Service details and appointment preferences</li>
                  <li>Communication preferences and consent records</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">SMS Messaging Terms</h2>
                
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Important SMS Disclosure</h3>
                  <p className="text-blue-800">
                    <strong>Your mobile number and SMS consent are NEVER shared with third parties for marketing purposes.</strong>
                  </p>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">Message Types</h3>
                <p className="mb-4">
                  When you opt in to SMS communications, you may receive the following types of messages:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li><strong>Account onboarding instructions</strong> - Setup and welcome messages</li>
                  <li><strong>Password reset and security codes</strong> - Account security notifications</li>
                  <li><strong>Appointment reminders for onboarding calls</strong> - Scheduled setup calls</li>
                  <li><strong>Platform status alerts</strong> - System maintenance and service updates</li>
                  <li><strong>Important service notifications</strong> - Critical account-related updates</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">Message Frequency</h3>
                <p className="mb-4">
                  <strong>Message frequency may vary</strong> based on your account activity and platform usage. 
                  Typically limited to essential account and service notifications only.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">Costs</h3>
                <p className="mb-4">
                  <strong>Message and data rates may apply</strong> as determined by your mobile carrier. 
                  Atlas Growth does not charge for SMS messages, but standard messaging rates from your carrier will apply.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">Opt-Out Instructions</h3>
                <p className="mb-4">
                  You can stop receiving SMS messages at any time:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li><strong>Reply STOP</strong> to any message to unsubscribe from all future SMS communications</li>
                  <li>Contact the contractor directly to opt out</li>
                  <li>Email us at nicholas@atlasgrowth.ai</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">Help Instructions</h3>
                <p className="mb-4">
                  For assistance with SMS messages:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li><strong>Reply HELP</strong> to any message for instructions and support contact information</li>
                  <li>Call 205-500-5170 for direct support</li>
                  <li>Email nicholas@atlasgrowth.ai</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
                <p className="mb-4">We use your information to:</p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Provide account management and onboarding support</li>
                  <li>Send account and service-related communications (if you opt in)</li>
                  <li>Improve our platform and customer experience</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information Sharing</h2>
                <p className="mb-4">
                  We do not sell, trade, or otherwise transfer your personal information to third parties for marketing purposes. 
                  We may share information with:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Platform service providers who assist with our operations (under strict confidentiality agreements)</li>
                  <li>Technical support and maintenance providers</li>
                  <li>Legal authorities when required by law</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
                <p className="mb-4">
                  We implement appropriate security measures to protect your personal information against unauthorized access, 
                  alteration, disclosure, or destruction.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
                <p className="mb-4">
                  If you have questions about this Privacy Policy or our SMS messaging practices:
                </p>
                <ul className="list-none mb-4">
                  <li>Email: nicholas@atlasgrowth.ai</li>
                  <li>Phone: 205-500-5170</li>
                  <li>Address: 1000 Lane Park Court, Mount Brook, Alabama 35223</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Policy</h2>
                <p className="mb-4">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
                  the new Privacy Policy on this page and updating the "Last updated" date.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}