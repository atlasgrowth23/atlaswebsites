import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { query } from '@/lib/db';

interface Business {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  phone?: string;
  email_1?: string;
  custom_domain?: string;
  tracking_enabled?: boolean;
  total_views?: number;
  last_viewed_at?: string;
}

interface BusinessDashboardProps {
  businesses: Business[];
}

export default function BusinessDashboard({ businesses }: BusinessDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState<'all' | 'Alabama' | 'Arkansas'>('all');
  const [siteFilter, setSiteFilter] = useState<'all' | 'has_site' | 'no_site'>('all');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [customizations, setCustomizations] = useState({
    custom_domain: '',
    hero_img: '',
    about_img: '',
    logo: ''
  });

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         business.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = stateFilter === 'all' || business.state === stateFilter;
    const matchesSite = siteFilter === 'all' || 
                       (siteFilter === 'has_site' && business.custom_domain) ||
                       (siteFilter === 'no_site' && !business.custom_domain);
    
    return matchesSearch && matchesState && matchesSite;
  });

  const toggleTracking = async (businessId: string, currentStatus: boolean) => {
    try {
      await fetch('/api/toggle-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, enabled: !currentStatus })
      });
      // Refresh page to show updated status
      window.location.reload();
    } catch (error) {
      alert('Error updating tracking status');
    }
  };

  const saveCustomizations = async (business: Business) => {
    try {
      // Save images
      await fetch('/api/template-customizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: business.id,
          customizations: {
            hero_img: customizations.hero_img,
            about_img: customizations.about_img,
            logo: customizations.logo
          }
        })
      });

      // Save domain if provided
      if (customizations.custom_domain) {
        await fetch('/api/manage-domain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId: business.id,
            customDomain: customizations.custom_domain
          })
        });
      }

      alert('✅ Customizations saved!');
      setExpandedCard(null);
      window.location.reload();
    } catch (error) {
      alert('❌ Error saving customizations');
    }
  };

  return (
    <>
      <Head>
        <title>Business Dashboard</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold">Business Dashboard</h1>
            <p className="text-gray-600 mt-2">{filteredBusinesses.length} businesses</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Search businesses..."
                className="px-3 py-2 border rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value as any)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All States</option>
                <option value="Alabama">Alabama</option>
                <option value="Arkansas">Arkansas</option>
              </select>
              <select
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value as any)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Businesses</option>
                <option value="has_site">Has Custom Site</option>
                <option value="no_site">No Custom Site</option>
              </select>
              <div className="text-sm text-gray-500 flex items-center">
                Tracking: {businesses.filter(b => b.tracking_enabled).length} active
              </div>
            </div>
          </div>

          {/* Business Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredBusinesses.map((business) => (
              <div key={business.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {/* Clickable Card Header */}
                <div 
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedCard(expandedCard === business.id ? null : business.id)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">{business.name}</h3>
                    <div className="flex items-center space-x-2">
                      {business.tracking_enabled ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Tracking On
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                          Tracking Off
                        </span>
                      )}
                      <svg 
                        className={`w-5 h-5 text-gray-400 transition-transform ${expandedCard === business.id ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Location:</strong> {business.city}, {business.state} {(business as any).postal_code}</p>
                    {business.phone && <p><strong>Phone:</strong> {business.phone}</p>}
                    {(business as any).location_reviews_link && (
                      <p><strong>Reviews:</strong> <a href={(business as any).location_reviews_link} target="_blank" className="text-blue-600 hover:underline">View Reviews</a></p>
                    )}
                    {business.total_views !== undefined && business.total_views > 0 && (
                      <p><strong>Total Views:</strong> {business.total_views}</p>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedCard === business.id && (
                  <div className="border-t bg-gray-50 p-6">
                    <div className="space-y-6">
                      {/* Quick Actions - Full Width */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link
                          href={`/t/moderntrust/${business.slug}`}
                          target="_blank"
                          className="bg-blue-500 text-white py-3 px-4 rounded text-center hover:bg-blue-600 font-medium"
                        >
                          View Website
                        </Link>
                        <button 
                          onClick={() => toggleTracking(business.id, business.tracking_enabled || false)}
                          className={`py-3 px-4 rounded font-medium ${
                            business.tracking_enabled
                              ? 'bg-red-500 text-white hover:bg-red-600'
                              : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                        >
                          {business.tracking_enabled ? 'Pause Tracking' : 'Start Tracking'}
                        </button>
                      </div>

                      {/* Enhanced Analytics */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-4 text-lg">📊 Website Analytics</h4>
                        <div className="bg-white p-6 rounded-lg border shadow-sm">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">{business.total_views || 0}</div>
                              <div className="text-xs text-gray-500">Total Views</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">
                                {business.tracking_enabled ? 'Active' : 'Paused'}
                              </div>
                              <div className="text-xs text-gray-500">Status</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">
                                {business.last_viewed_at ? 'Recent' : 'None'}
                              </div>
                              <div className="text-xs text-gray-500">Activity</div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Last Viewed</span>
                              <span className="text-sm font-medium">
                                {business.last_viewed_at 
                                  ? new Date(business.last_viewed_at).toLocaleDateString() 
                                  : 'Never'
                                }
                              </span>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Engagement Score</span>
                                <span className="font-medium">{Math.min(Math.floor((business.total_views || 0) / 10 * 100), 100)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300" 
                                  style={{ width: `${Math.min(((business.total_views || 0) / 10 * 100), 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Website Customization */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-4 text-lg">🎨 Website Customization</h4>
                        <div className="bg-white p-6 rounded-lg border shadow-sm">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Hero Image URL</label>
                              <input
                                type="url"
                                placeholder="https://example.com/hero.jpg"
                                className="w-full px-3 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={customizations.hero_img}
                                onChange={(e) => setCustomizations({...customizations, hero_img: e.target.value})}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">About Image URL</label>
                              <input
                                type="url"
                                placeholder="https://example.com/about.jpg"
                                className="w-full px-3 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={customizations.about_img}
                                onChange={(e) => setCustomizations({...customizations, about_img: e.target.value})}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
                              <input
                                type="url"
                                placeholder="https://example.com/logo.svg"
                                className="w-full px-3 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={customizations.logo}
                                onChange={(e) => setCustomizations({...customizations, logo: e.target.value})}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Custom Domain</label>
                              <input
                                type="text"
                                placeholder="example.com"
                                className="w-full px-3 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={customizations.custom_domain}
                                onChange={(e) => setCustomizations({...customizations, custom_domain: e.target.value})}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="mt-6 flex justify-end">
                      <button 
                        onClick={() => saveCustomizations(business)}
                        className="bg-green-600 text-white py-2 px-6 rounded hover:bg-green-700"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>


      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const result = await query(`
      SELECT 
        c.*,
        t.tracking_enabled,
        t.total_views,
        t.last_viewed_at
      FROM companies c
      LEFT JOIN enhanced_tracking t ON c.id = t.company_id
      WHERE (c.state = 'Alabama' OR c.state = 'Arkansas')
      ORDER BY c.state, c.city, c.name
    `);

    return {
      props: {
        businesses: result.rows || [],
      },
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      props: {
        businesses: [],
      },
    };
  }
};