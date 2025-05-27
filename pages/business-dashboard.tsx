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
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
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

  const saveCustomizations = async () => {
    if (!selectedBusiness) return;
    
    try {
      // Save images
      await fetch('/api/template-customizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedBusiness.id,
          customizations: {
            hero_img: customizations.hero_img,
            about_img: customizations.about_img
          }
        })
      });

      // Save domain if provided
      if (customizations.custom_domain) {
        await fetch('/api/manage-domain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId: selectedBusiness.id,
            customDomain: customizations.custom_domain
          })
        });
      }

      alert('✅ Customizations saved!');
      setSelectedBusiness(null);
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBusinesses.map((business) => (
              <div key={business.id} className="bg-white rounded-lg shadow-sm border p-4">
                {/* Business Info */}
                <div className="mb-4">
                  <h3 className="font-semibold text-lg">{business.name}</h3>
                  <p className="text-gray-600">{business.city}, {business.state}</p>
                  {business.phone && <p className="text-sm text-gray-500">{business.phone}</p>}
                  {business.email_1 && <p className="text-sm text-gray-500">{business.email_1}</p>}
                  {business.custom_domain && (
                    <p className="text-sm text-blue-600">🌐 {business.custom_domain}</p>
                  )}
                </div>

                {/* Tracking Status */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      business.tracking_enabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {business.tracking_enabled ? 'Tracking ON' : 'Tracking OFF'}
                    </span>
                    {business.total_views > 0 && (
                      <span className="ml-2 text-gray-500">{business.total_views} views</span>
                    )}
                  </div>
                  <button
                    onClick={() => toggleTracking(business.id, business.tracking_enabled || false)}
                    className={`px-3 py-1 rounded text-xs ${
                      business.tracking_enabled
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {business.tracking_enabled ? 'Pause' : 'Start'}
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/t/moderntrust/${business.slug}`}
                    target="_blank"
                    className="flex-1 text-center bg-blue-500 text-white py-2 px-3 rounded text-sm hover:bg-blue-600"
                  >
                    View Site
                  </Link>
                  <button
                    onClick={() => setSelectedBusiness(business)}
                    className="flex-1 bg-gray-500 text-white py-2 px-3 rounded text-sm hover:bg-gray-600"
                  >
                    Customize
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customization Modal */}
        {selectedBusiness && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Customize {selectedBusiness.name}</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Custom Domain</label>
                  <input
                    type="text"
                    placeholder="example.com"
                    className="w-full px-3 py-2 border rounded-md"
                    value={customizations.custom_domain}
                    onChange={(e) => setCustomizations({...customizations, custom_domain: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Hero Image URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/hero.jpg"
                    className="w-full px-3 py-2 border rounded-md"
                    value={customizations.hero_img}
                    onChange={(e) => setCustomizations({...customizations, hero_img: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">About Image URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/about.jpg"
                    className="w-full px-3 py-2 border rounded-md"
                    value={customizations.about_img}
                    onChange={(e) => setCustomizations({...customizations, about_img: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setSelectedBusiness(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCustomizations}
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
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