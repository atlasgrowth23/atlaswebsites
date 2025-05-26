import type { NextPage } from 'next';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Company } from '@/types';
import { queryMany } from '@/lib/db';

interface TrackingData {
  company_id: string;
  tracking_enabled: boolean;
  total_views: number;
  template_views: Record<string, number>;
  last_viewed_at: string;
  activated_at: string;
  name: string;
  slug: string;
}

interface HomeProps {
  companies: Company[];
  trackingData: TrackingData[];
}

const Home: NextPage<HomeProps> = ({ companies, trackingData: initialTrackingData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCompanies, setFilteredCompanies] = useState(companies);
  const [trackingData, setTrackingData] = useState(initialTrackingData);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (!term) {
      setFilteredCompanies(companies);
      return;
    }
    
    const filtered = companies.filter(company => 
      company.name.toLowerCase().includes(term) || 
      (company.city && company.city.toLowerCase().includes(term)) || 
      (company.state && company.state.toLowerCase().includes(term))
    );
    
    setFilteredCompanies(filtered);
  };

  const handleTrackingToggle = async (companyId: string, action: 'activate' | 'deactivate') => {
    try {
      const response = await fetch('/api/prospect-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, action })
      });
      
      if (response.ok) {
        // Refresh tracking data
        const trackingResponse = await fetch('/api/prospect-tracking');
        const data = await trackingResponse.json();
        setTrackingData(data.trackingData);
      }
    } catch (error) {
      console.error('Error toggling tracking:', error);
    }
  };

  const getTrackingInfo = (companyId: string) => {
    return trackingData.find(t => t.company_id === companyId);
  };

  return (
    <>
      <Head>
        <title>HVAC Company Websites | Static Site Generator</title>
        <meta name="description" content="Generate static websites for HVAC contractors with our Next.js-based static site generator." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Static Websites for HVAC Contractors
            </h1>
            <p className="text-xl mb-8">
              Generate professional, high-performance websites for HVAC businesses with our static site generator.
            </p>
            <div className="max-w-md mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search companies by name or location..."
                  className="w-full px-5 py-3 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={handleSearch}
                />
                <div className="absolute right-3 top-3 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">
            {searchTerm ? 'Search Results' : 'Featured HVAC Companies'}
          </h2>
          
          {filteredCompanies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map((company) => {
                const trackingInfo = getTrackingInfo(company.id?.toString() || '');
                const isTracking = trackingInfo?.tracking_enabled || false;
                
                return (
                  <div key={company.id || company.name} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold">{company.name}</h3>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isTracking ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isTracking ? '📊 Tracking' : '⏸️ Inactive'}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-3">
                        {company.city ? company.city : ''}
                        {company.city && company.state ? ', ' : ''}
                        {company.state ? company.state : ''}
                      </p>

                      {/* Analytics Display */}
                      {isTracking && trackingInfo && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <div className="text-sm font-medium text-blue-900 mb-1">Analytics</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="font-medium">{trackingInfo.total_views || 0}</span>
                              <span className="text-gray-600"> total views</span>
                            </div>
                            <div>
                              {trackingInfo.last_viewed_at && (
                                <div className="text-gray-600">
                                  Last: {new Date(trackingInfo.last_viewed_at).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                          {trackingInfo.template_views && Object.keys(trackingInfo.template_views).length > 0 && (
                            <div className="mt-2 text-xs">
                              <div className="font-medium text-blue-900 mb-1">Template Views:</div>
                              {Object.entries(trackingInfo.template_views).map(([template, views]) => (
                                <span key={template} className="inline-block bg-white px-2 py-1 rounded mr-1 mb-1">
                                  {template}: {views}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between items-center gap-2">
                        <div className="flex gap-2">
                          <Link href={`/templates/${company.slug}`} passHref>
                            <Button size="sm" variant="outline">Choose Style</Button>
                          </Link>
                        </div>
                        
                        <button
                          onClick={() => handleTrackingToggle(
                            company.id?.toString() || '',
                            isTracking ? 'deactivate' : 'activate'
                          )}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            isTracking 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {isTracking ? '🛑 Stop Tracking' : '🚀 Send to Prospect'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No companies found matching your search criteria.</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">About This Project</h2>
            <p className="text-lg mb-8">
              This is a Static Site Generator built with Next.js that creates optimized, 
              high-performance websites for HVAC contractors. Each site is statically 
              generated at build time and deployed as standalone HTML, CSS, and JavaScript.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button className="bg-primary">Learn More</Button>
              <Button variant="outline">View Documentation</Button>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} HVAC Static Site Generator. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
};

export async function getStaticProps() {
  try {
    // Fetch companies
    const companies = await queryMany(`
      SELECT id, slug, name, city, state 
      FROM companies 
      ORDER BY name
      LIMIT 50
    `);

    // Fetch tracking data
    const trackingData = await queryMany(`
      SELECT pt.*, c.name, c.slug 
      FROM prospect_tracking pt
      JOIN companies c ON c.id::text = pt.company_id
      ORDER BY pt.activated_at DESC NULLS LAST
    `);

    return {
      props: {
        companies: companies || [],
        trackingData: trackingData || [],
      },
      // Revalidate every 5 minutes to keep tracking data fresh
      revalidate: 300,
    };
  } catch (err) {
    console.error('Unexpected error fetching data:', err);
    return {
      props: {
        companies: [],
        trackingData: [],
      },
    };
  }
}

export default Home;