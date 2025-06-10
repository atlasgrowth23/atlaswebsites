import React from 'react';
import Head from 'next/head';

export default function TermsOfService() {
  return (
    <>
      <Head>
        <title>Terms of Service | Atlas Growth</title>
        <meta name="description" content="Atlas Growth Terms of Service and SMS messaging terms" />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
            
            <div className="prose max-w-none">
              <p className="text-sm text-gray-600 mb-6">
                Last updated: {new Date().toLocaleDateString()}
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Acceptance of Terms</h2>
                <p className="mb-4">
                  By using Atlas Growth's services or websites, you agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use our services.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Service Description</h2>
                <p className="mb-4">
                  Atlas Growth provides customer communication services for home service contractors, including 
                  appointment scheduling, SMS notifications, and customer feedback collection.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">SMS Messaging Terms & Conditions</h2>
                
                <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">SMS Service Agreement</h3>
                  <p className="text-green-800">
                    By providing your mobile number and consenting to SMS communications, you agree to the following terms.
                  </p>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">Consent and Opt-In</h3>
                <ul className="list-disc pl-6 mb-4">
                  <li>SMS communications require your explicit consent through our opt-in process</li>
                  <li>Consent is not a condition of purchase or service</li>
                  <li>You may opt in or opt out at any time</li>
                  <li>We store records of your consent including timestamp and IP address</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">Message Types and Purpose</h3>
                <p className="mb-4">
                  Atlas Growth sends only transactional SMS messages related to your service appointments:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li><strong>Appointment confirmations and reminders</strong></li>
                  <li><strong>Technician en-route notifications</strong></li>
                  <li><strong>Service status updates</strong></li>
                  <li><strong>Job completion confirmations</strong></li>
                  <li><strong>Post-service satisfaction surveys</strong> (optional)</li>
                  <li><strong>Review requests</strong> (sent once per completed job)</li>
                </ul>
                
                <p className="mb-4 font-semibold">
                  We DO NOT send promotional messages, marketing campaigns, or contests via SMS.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">Message Frequency</h3>
                <p className="mb-4">
                  <strong>Message frequency may vary</strong> depending on your service appointments. 
                  Typical frequency is 2-4 messages per service appointment over the duration of the customer relationship.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">Costs and Charges</h3>
                <p className="mb-4">
                  <strong>Message and data rates may apply</strong> as charged by your mobile carrier. 
                  Atlas Growth does not charge fees for SMS messages, but your carrier's standard messaging rates will apply.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">Opt-Out and Cancellation</h3>
                <p className="mb-4">
                  You can cancel SMS messages at any time using any of these methods:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li><strong>Reply STOP</strong> to any SMS message to immediately unsubscribe</li>
                  <li>Contact us at support@atlasgrowth.ai</li>
                  <li>Call 601-555-0000</li>
                  <li>Request opt-out through your contractor</li>
                </ul>
                <p className="mb-4">
                  After opting out, you will receive one final confirmation message, then no further messages will be sent.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">Help and Support</h3>
                <p className="mb-4">
                  For help with SMS messages:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li><strong>Reply HELP</strong> to any message for assistance and contact information</li>
                  <li>Call our support line: 601-555-0000</li>
                  <li>Email: support@atlasgrowth.ai</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">Privacy and Data Protection</h3>
                <ul className="list-disc pl-6 mb-4">
                  <li><strong>Your mobile number is NEVER shared with third parties for marketing</strong></li>
                  <li>SMS consent records are stored securely and used only for service delivery</li>
                  <li>All data handling complies with applicable privacy laws</li>
                  <li>See our Privacy Policy for complete details on data handling</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Responsibilities</h2>
                <p className="mb-4">You agree to:</p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Provide accurate information when booking services</li>
                  <li>Use services only for their intended purpose</li>
                  <li>Respect the intellectual property rights of Atlas Growth and its partners</li>
                  <li>Not attempt to disrupt or compromise our systems</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Service Availability</h2>
                <p className="mb-4">
                  While we strive for high availability, we do not guarantee uninterrupted service. 
                  We may temporarily suspend services for maintenance, updates, or technical issues.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
                <p className="mb-4">
                  Atlas Growth provides communication services only. We are not responsible for the quality, 
                  timeliness, or completion of services provided by contractors. Our liability is limited to 
                  the communication services we directly provide.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Modifications to Terms</h2>
                <p className="mb-4">
                  We may modify these Terms of Service at any time. Material changes will be communicated 
                  through our website or direct notification. Continued use of our services constitutes 
                  acceptance of modified terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
                <p className="mb-4">
                  For questions about these Terms of Service or our SMS messaging:
                </p>
                <ul className="list-none mb-4">
                  <li>Email: support@atlasgrowth.ai</li>
                  <li>Phone: 601-555-0000</li>
                  <li>Address: Atlas Growth, Business Services Division</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Governing Law</h2>
                <p className="mb-4">
                  These Terms of Service are governed by the laws of the United States and the state in which 
                  Atlas Growth operates, without regard to conflict of law principles.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}