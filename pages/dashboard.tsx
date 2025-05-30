import type { NextPage } from 'next';
import React, { useState, useEffect } from 'react';
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

interface DashboardProps {
  companies: Company[];
  trackingData: TrackingData[];
}

const Dashboard: NextPage<DashboardProps> = ({ companies, trackingData: initialTrackingData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCompanies, setFilteredCompanies] = useState(companies);
  const [trackingData, setTrackingData] = useState(initialTrackingData);
  const [feedback, setFeedback] = useState<{[key: string]: string}>({});
  const [filters, setFilters] = useState({
    state: '',
    trackingStatus: ''
  });

  const applyFilters = () => {
    let filtered = companies.filter(company => {
      // Search term filter
      const matchesSearch = !searchTerm || 
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (company.city && company.city.toLowerCase().includes(searchTerm.toLowerCase())) || 
        (company.state && company.state.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // State filter (Alabama/Arkansas only)
      const matchesState = !filters.state || company.state === filters.state;
      
      // Tracking status filter
      const trackingInfo = getTrackingInfo(company.id?.toString() || '');
      const isTracking = trackingInfo?.tracking_enabled || false;
      const matchesTracking = !filters.trackingStatus || 
        (filters.trackingStatus === 'active' && isTracking) ||
        (filters.trackingStatus === 'inactive' && !isTracking);
      
      return matchesSearch && matchesState && matchesTracking;
    });
    
    setFilteredCompanies(filtered);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  // Apply filters when search term or filters change
  useEffect(() => {
    applyFilters();
  }, [searchTerm, filters, companies, trackingData]);

  const handleTrackingToggle = async (companyId: string, action: 'activate' | 'deactivate') => {
    try {
      const response = await fetch('/api/prospect-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, action })
      });
      
      if (response.ok) {
        // Show success feedback
        setFeedback({
          ...feedback,
          [companyId]: action === 'activate' ? '✅ Tracking Activated!' : '⏹️ Tracking Stopped'
        });
        
        // Clear feedback after 3 seconds
        setTimeout(() => {
          setFeedback(prev => ({ ...prev, [companyId]: '' }));
        }, 3000);
        
        // Refresh tracking data
        const trackingResponse = await fetch('/api/prospect-tracking');
        const data = await trackingResponse.json();
        setTrackingData(data.trackingData);
      }
    } catch (error) {
      console.error('Error toggling tracking:', error);
      setFeedback({
        ...feedback,
        [companyId]: '❌ Error occurred'
      });
    }
  };

  const getTrackingInfo = (companyId: string) => {
    return trackingData.find(t => t.company_id === companyId);
  };

  return (
    <>
      <Head>
        <title>Business CRM Dashboard</title>
        <meta name="description" content="Internal dashboard for managing business websites and prospect tracking" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Business CRM Dashboard</h1>
              <div className="text-sm text-gray-600">
                {companies.length} companies • {trackingData.filter(t => t.tracking_enabled).length} tracking active
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            {/* Search Bar */}
            <div className="relative mb-6">
              <input
                type="text"
                placeholder="Search companies by name or location..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={handleSearch}
              />
              <div className="absolute right-3 top-3 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">State:</label>
                  <select
                    value={filters.state}
                    onChange={(e) => handleFilterChange('state', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Alabama & Arkansas</option>
                    <option value="AL">Alabama (AL)</option>
                    <option value="AR">Arkansas (AR)</option>
                    <option value="Alabama">Alabama</option>
                    <option value="Arkansas">Arkansas</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Tracking:</label>
                  <select
                    value={filters.trackingStatus}
                    onChange={(e) => handleFilterChange('trackingStatus', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Companies</option>
                    <option value="active">Active Tracking</option>
                    <option value="inactive">Inactive Tracking</option>
                  </select>
                </div>
                
                {/* Clear Filters Button */}
                {(filters.state || filters.trackingStatus) && (
                  <button
                    onClick={() => setFilters({ state: '', trackingStatus: '' })}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    Clear Filters
                  </button>
                )}
                
                <div className="ml-auto text-sm text-gray-600">
                  Showing {filteredCompanies.length} of {companies.length} companies
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Companies Grid */}
        <div className="container mx-auto px-4 pb-8">
          {filteredCompanies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map((company) => {
                const trackingInfo = getTrackingInfo(company.id?.toString() || '');
                const isTracking = trackingInfo?.tracking_enabled || false;
                const companyFeedback = feedback[company.id?.toString() || ''];
                
                return (
                  <div key={company.id || company.name} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <Link href={`/company/${company.slug}`} className="block p-6 cursor-pointer">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-bold">{company.name}</h3>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isTracking ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isTracking ? '📊 Active' : '⏸️ Inactive'}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4">
                        {company.city ? company.city : ''}
                        {company.city && company.state ? ', ' : ''}
                        {company.state ? company.state : ''}
                      </p>
                    </Link>

                    {/* Analytics Display */}
                    <div className="px-6">
                      {isTracking && trackingInfo && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <div className="text-sm font-medium text-blue-900 mb-2">Analytics</div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="font-bold text-lg">{trackingInfo.total_views || 0}</span>
                              <div className="text-gray-600 text-xs">Total Views</div>
                            </div>
                            <div>
                              {trackingInfo.last_viewed_at && (
                                <>
                                  <div className="font-medium">
                                    {new Date(trackingInfo.last_viewed_at).toLocaleDateString()}
                                  </div>
                                  <div className="text-gray-600 text-xs">Last Viewed</div>
                                </>
                              )}
                            </div>
                          </div>
                          {trackingInfo.template_views && Object.keys(trackingInfo.template_views).length > 0 && (
                            <div className="mt-3">
                              <div className="text-xs font-medium text-blue-900 mb-1">Template Views:</div>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(trackingInfo.template_views).map(([template, views]) => (
                                  <span key={template} className="inline-block bg-white px-2 py-1 rounded text-xs">
                                    {template}: {views}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Feedback Message */}
                      {companyFeedback && (
                        <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
                          {companyFeedback}
                        </div>
                      )}

                      <div className="flex justify-between items-center gap-2 pb-6">
                        <Link href={`/templates/${company.slug}`} passHref>
                          <Button size="sm" variant="outline">Select Template</Button>
                        </Link>
                        
                        <button
                          onClick={() => handleTrackingToggle(
                            company.id?.toString() || '',
                            isTracking ? 'deactivate' : 'activate'
                          )}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
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
            <div className="text-center p-8 bg-white rounded-lg shadow-sm">
              <p className="text-gray-600">No companies found matching your search criteria.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export async function getServerSideProps() {
  try {
    // Fetch companies with geocoded location data, sorted by location
    const companies = await queryMany(`
      SELECT c.id, c.slug, c.name, 
             COALESCE(c.city, g.locality) as city,
             COALESCE(c.state, g.administrative_area_level_1) as state,
             c.latitude, c.longitude
      FROM companies c
      LEFT JOIN geocoded_locations g ON c.id = g.company_id
      ORDER BY 
        COALESCE(c.state, g.administrative_area_level_1),
        COALESCE(c.city, g.locality),
        c.latitude,
        c.longitude,
        c.name
    `);

    // Fetch tracking data
    const trackingData = await queryMany(`
      SELECT pt.*, c.name, c.slug 
      FROM prospect_tracking pt
      JOIN companies c ON c.id::text = pt.company_id
      ORDER BY pt.activated_at DESC NULLS LAST
    `);

    // Convert Date objects to strings for JSON serialization
    const serializedTrackingData = (trackingData || []).map((item: any) => ({
      ...item,
      activated_at: item.activated_at ? item.activated_at.toISOString() : null,
      last_viewed_at: item.last_viewed_at ? item.last_viewed_at.toISOString() : null,
      created_at: item.created_at ? item.created_at.toISOString() : null,
    }));

    return {
      props: {
        companies: companies || [],
        trackingData: serializedTrackingData,
      },
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

export default Dashboard;