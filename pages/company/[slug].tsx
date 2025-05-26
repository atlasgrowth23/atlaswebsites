import React, { useState } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { query, queryOne } from '@/lib/db';
import { Company } from '@/types';
import { processLogo } from '@/lib/processLogo';

interface TrackingData {
  company_id: string;
  tracking_enabled: boolean;
  total_views: number;
  template_views: Record<string, number>;
  last_viewed_at: string;
  activated_at: string;
}

interface CompanyDetailProps {
  company: Company;
  trackingData: TrackingData | null;
}

export default function CompanyDetail({ company, trackingData: initialTrackingData }: CompanyDetailProps) {
  const [trackingData, setTrackingData] = useState(initialTrackingData);
  const [feedback, setFeedback] = useState('');

  const handleTrackingToggle = async (action: 'activate' | 'deactivate') => {
    try {
      const response = await fetch('/api/prospect-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          companyId: company.id?.toString(),
          action
        })
      });
      
      if (response.ok) {
        setFeedback(action === 'activate' ? '✅ Tracking Activated!' : '⏹️ Tracking Stopped');
        
        // Refresh tracking data
        const trackingResponse = await fetch('/api/prospect-tracking');
        const data = await trackingResponse.json();
        const updatedTracking = data.trackingData.find((t: any) => t.company_id === company.id?.toString());
        setTrackingData(updatedTracking || null);
        
        // Clear feedback after 3 seconds
        setTimeout(() => setFeedback(''), 3000);
      }
    } catch (error) {
      console.error('Error toggling tracking:', error);
      setFeedback('❌ Error occurred');
    }
  };

  const isTracking = trackingData?.tracking_enabled || false;

  return (
    <>
      <Head>
        <title>{company.name} - Company Details</title>
        <meta name="description" content={`Detailed analytics and management for ${company.name}`} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4 mb-4">
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
                ← Back to Dashboard
              </Link>
            </div>
            
            <div className="flex items-center gap-6">
              {company.logoUrl && (
                <Image 
                  src={company.logoUrl}
                  alt={`${company.name} logo`}
                  width={80}
                  height={60}
                  className="object-contain bg-white rounded-lg shadow-sm p-2"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
                <p className="text-gray-600 mt-1">
                  {company.city && company.state ? `${company.city}, ${company.state}` : 'HVAC Services'}
                </p>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                  isTracking ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {isTracking ? '📊 Tracking Active' : '⏸️ Tracking Inactive'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Analytics Panel */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-6">Website Analytics</h2>
                
                {isTracking && trackingData ? (
                  <div className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-900">{trackingData.total_views || 0}</div>
                        <div className="text-sm text-blue-600">Total Views</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-900">
                          {trackingData.last_viewed_at ? new Date(trackingData.last_viewed_at).toLocaleDateString() : 'Never'}
                        </div>
                        <div className="text-sm text-green-600">Last Viewed</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-900">
                          {trackingData.activated_at ? new Date(trackingData.activated_at).toLocaleDateString() : 'Never'}
                        </div>
                        <div className="text-sm text-purple-600">Tracking Since</div>
                      </div>
                    </div>

                    {/* Template Views */}
                    {trackingData.template_views && Object.keys(trackingData.template_views).length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Template Preferences</h3>
                        <div className="space-y-2">
                          {Object.entries(trackingData.template_views).map(([template, views]) => (
                            <div key={template} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <span className="font-medium capitalize">{template}</span>
                              <span className="text-lg font-bold">{views} views</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📊</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
                    <p className="text-gray-600">Activate tracking to start collecting analytics data for this company.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Panel */}
            <div className="space-y-6">
              
              {/* Feedback Message */}
              {feedback && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                  {feedback}
                </div>
              )}

              {/* Tracking Control */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Prospect Tracking</h3>
                <button
                  onClick={() => handleTrackingToggle(isTracking ? 'deactivate' : 'activate')}
                  className={`w-full py-3 px-6 rounded-lg font-bold transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5 ${
                    isTracking 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isTracking ? '🛑 Stop Tracking' : '🚀 Send to Prospect'}
                </button>
              </div>

              {/* Template Selection */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Website Templates</h3>
                <div className="space-y-3">
                  <Link href={`/templates/${company.slug}`}>
                    <button className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all duration-300 hover:shadow-lg">
                      Choose Template Style
                    </button>
                  </Link>
                  <Link href={`/template-editor?slug=${company.slug}`}>
                    <button className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all duration-300 hover:shadow-lg">
                      🎨 Customize Templates
                    </button>
                  </Link>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                <div className="space-y-2">
                  <a 
                    href={`/t/moderntrust/${company.slug}`} 
                    target="_blank" 
                    className="block w-full py-2 px-4 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    🔗 ModernTrust Style
                  </a>
                  <a 
                    href={`/t/boldenergy/${company.slug}`} 
                    target="_blank" 
                    className="block w-full py-2 px-4 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    🔗 BoldEnergy Style
                  </a>
                  <a 
                    href={`/t/naturalearthpro/${company.slug}`} 
                    target="_blank" 
                    className="block w-full py-2 px-4 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    🔗 NaturalEarthPro Style
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps({ params }: any) {
  try {
    const slug = params?.slug as string;

    // Get company data
    const company = await queryOne(`
      SELECT * FROM companies 
      WHERE slug = $1
    `, [slug]);

    if (!company) {
      return {
        notFound: true,
      };
    }

    // Process logo
    const logoUrl = await processLogo(company.slug, company.logo);
    company.logoUrl = logoUrl;

    // Get tracking data
    const trackingData = await queryOne(`
      SELECT * FROM prospect_tracking 
      WHERE company_id = $1
    `, [company.id]);

    // Convert Date objects to strings for JSON serialization
    const serializedTrackingData = trackingData ? {
      ...trackingData,
      activated_at: trackingData.activated_at ? trackingData.activated_at.toISOString() : null,
      last_viewed_at: trackingData.last_viewed_at ? trackingData.last_viewed_at.toISOString() : null,
      created_at: trackingData.created_at ? trackingData.created_at.toISOString() : null,
    } : null;

    return {
      props: {
        company,
        trackingData: serializedTrackingData,
      },
    };
  } catch (error) {
    console.error('Error fetching company data:', error);
    return {
      notFound: true,
    };
  }
};