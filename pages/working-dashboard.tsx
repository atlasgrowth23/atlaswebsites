import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { getAllCompanies } from '@/lib/supabase-db';

interface CompanyWithTracking {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  phone?: string;
  email_1?: string;
  tracking_enabled?: boolean;
  company_frames?: {
    hero_img?: string;
    hero_img_2?: string;
    about_img?: string;
    logo_url?: string;
  };
}

interface WorkingDashboardProps {
  companies: CompanyWithTracking[];
}

export default function WorkingDashboard({ companies }: WorkingDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [trackingFilter, setTrackingFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [stateFilter, setStateFilter] = useState<'all' | 'Alabama' | 'Arkansas'>('all');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [customizations, setCustomizations] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, string>>({});
  const [trackingData, setTrackingData] = useState<Record<string, any>>({});

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTracking = trackingFilter === 'all' ||
                           (trackingFilter === 'enabled' && company.tracking_enabled === true) ||
                           (trackingFilter === 'disabled' && company.tracking_enabled === false);
    const matchesState = stateFilter === 'all' || company.state === stateFilter;
    return matchesSearch && matchesTracking && matchesState;
  });

  const handleCustomizationChange = (companyId: string, field: string, value: string) => {
    setCustomizations(prev => ({
      ...prev,
      [companyId]: {
        ...prev[companyId],
        [field]: value
      }
    }));
  };

  const toggleTracking = async (companyId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/toggle-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: companyId, enabled: !currentStatus })
      });
      
      if (response.ok) {
        // Update the local state instead of full page reload
        const updatedCompanies = companies.map(company => 
          company.id === companyId 
            ? { ...company, tracking_enabled: !currentStatus }
            : company
        );
        
        // If tracking was just enabled, fetch analytics
        if (!currentStatus) {
          await fetchTrackingData(companyId);
        }
        
        window.location.reload(); // Still reload to ensure consistency
      } else {
        alert('Error updating tracking status');
      }
    } catch (error) {
      alert('Error updating tracking status');
    }
  };

  const fetchTrackingData = async (companyId: string) => {
    try {
      // For now, simulate tracking data - you can replace with real API call
      const mockData = {
        total_views: Math.floor(Math.random() * 100) + 1,
        total_sessions: Math.floor(Math.random() * 50) + 1,
        avg_time_seconds: Math.floor(Math.random() * 300) + 30,
        last_viewed_at: new Date().toISOString(),
        device_breakdown: {
          desktop: Math.floor(Math.random() * 50) + 20,
          mobile: Math.floor(Math.random() * 40) + 10,
          tablet: Math.floor(Math.random() * 10) + 1
        }
      };
      
      setTrackingData(prev => ({
        ...prev,
        [companyId]: mockData
      }));
    } catch (error) {
      console.error('Error fetching tracking data:', error);
    }
  };

  const toggleCardExpanded = (companyId: string) => {
    if (expandedCard === companyId) {
      setExpandedCard(null);
    } else {
      setExpandedCard(companyId);
      // Fetch tracking data when expanding if tracking is enabled
      const company = companies.find(c => c.id === companyId);
      if (company?.tracking_enabled && !trackingData[companyId]) {
        fetchTrackingData(companyId);
      }
    }
  };

  const saveCustomizations = async (company: CompanyWithTracking) => {
    setSaving(prev => ({ ...prev, [company.id]: true }));
    setSaveStatus(prev => ({ ...prev, [company.id]: 'Saving...' }));
    
    try {
      const companyCustomizations = customizations[company.id] || {};
      
      // Only save fields that have values
      const fieldsToSave: any = {};
      
      if (companyCustomizations.hero_img?.trim()) {
        fieldsToSave.hero_img = companyCustomizations.hero_img.trim();
      }
      if (companyCustomizations.hero_img_2?.trim()) {
        fieldsToSave.hero_img_2 = companyCustomizations.hero_img_2.trim();
      }
      if (companyCustomizations.about_img?.trim()) {
        fieldsToSave.about_img = companyCustomizations.about_img.trim();
      }
      if (companyCustomizations.logo_url?.trim()) {
        fieldsToSave.logo_url = companyCustomizations.logo_url.trim();
      }

      console.log('Saving customizations for', company.name, ':', fieldsToSave);

      if (Object.keys(fieldsToSave).length > 0) {
        const response = await fetch('/api/template-customizations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId: company.id,
            customizations: fieldsToSave
          })
        });

        const result = await response.json();
        console.log('Save result:', result);

        if (response.ok) {
          setSaveStatus(prev => ({ ...prev, [company.id]: '✅ Saved successfully!' }));
          
          // Clear the form after 2 seconds
          setTimeout(() => {
            setSaveStatus(prev => ({ ...prev, [company.id]: '' }));
            setCustomizations(prev => ({ ...prev, [company.id]: {} }));
          }, 2000);
        } else {
          setSaveStatus(prev => ({ ...prev, [company.id]: `❌ Error: ${result.error}` }));
        }
      } else {
        setSaveStatus(prev => ({ ...prev, [company.id]: '⚠️ No changes to save' }));
        setTimeout(() => {
          setSaveStatus(prev => ({ ...prev, [company.id]: '' }));
        }, 2000);
      }
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus(prev => ({ ...prev, [company.id]: '❌ Save failed' }));
    } finally {
      setSaving(prev => ({ ...prev, [company.id]: false }));
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [company.id]: '' }));
      }, 3000);
    }
  };

  const getCurrentImageUrl = (company: CompanyWithTracking, field: string): string => {
    return company.company_frames?.[field as keyof typeof company.company_frames] || '';
  };

  return (
    <>
      <Head>
        <title>Working Dashboard - ModernTrust Template</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Working Dashboard</h1>
            <p className="text-gray-600 mt-2">
              ModernTrust Template Customization • {filteredCompanies.length} of {companies.length} businesses
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Search and Filters */}
          <div className="mb-8 flex gap-4 flex-wrap">
            <input
              type="text"
              placeholder="Search businesses..."
              className="flex-1 max-w-md px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value as any)}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All States</option>
              <option value="Alabama">Alabama</option>
              <option value="Arkansas">Arkansas</option>
            </select>
            <select
              value={trackingFilter}
              onChange={(e) => setTrackingFilter(e.target.value as any)}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Tracking</option>
              <option value="enabled">Tracking On</option>
              <option value="disabled">Tracking Off</option>
            </select>
          </div>

          {/* Business Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredCompanies.map((company) => (
              <div key={company.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {/* Clickable Header */}
                <div 
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleCardExpanded(company.id)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">{company.name}</h3>
                    <div className="flex items-center gap-2">
                      {company.tracking_enabled ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                          Tracking On
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                          Tracking Off
                        </span>
                      )}
                      <svg 
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          expandedCard === company.id ? 'rotate-180' : ''
                        }`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-gray-600">{company.city}, {company.state}</p>
                  {company.phone && <p className="text-gray-600">{company.phone}</p>}
                  
                  <div className="flex gap-2 mt-3">
                    <Link 
                      href={`/t/moderntrust/${company.slug}`}
                      target="_blank"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Website →
                    </Link>
                    {company.tracking_enabled && (
                      <Link 
                        href={`/session-analytics?company=${company.id}`}
                        className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Analytics →
                      </Link>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedCard === company.id && (
                  <div className="border-t bg-gray-50">
                    {/* Tracking Toggle Button */}
                    <div className="p-4 border-b bg-white">
                      <button
                        onClick={() => toggleTracking(company.id, company.tracking_enabled || false)}
                        className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                          company.tracking_enabled
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {company.tracking_enabled ? '⏸️ Pause Tracking' : '▶️ Start Tracking'}
                      </button>
                    </div>

                    {/* Tracking Analytics */}
                    {company.tracking_enabled && trackingData[company.id] && (
                      <div className="p-4 border-b bg-blue-50">
                        <h4 className="font-medium text-gray-900 mb-3">📊 Tracking Analytics</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="bg-white p-3 rounded">
                            <div className="text-2xl font-bold text-blue-600">
                              {trackingData[company.id].total_views}
                            </div>
                            <div className="text-gray-600">Total Views</div>
                          </div>
                          <div className="bg-white p-3 rounded">
                            <div className="text-2xl font-bold text-green-600">
                              {trackingData[company.id].total_sessions}
                            </div>
                            <div className="text-gray-600">Sessions</div>
                          </div>
                          <div className="bg-white p-3 rounded">
                            <div className="text-2xl font-bold text-purple-600">
                              {Math.round(trackingData[company.id].avg_time_seconds)}s
                            </div>
                            <div className="text-gray-600">Avg Time</div>
                          </div>
                          <div className="bg-white p-3 rounded">
                            <div className="text-lg font-bold text-orange-600">
                              {Math.round((trackingData[company.id].device_breakdown.mobile / 
                                (trackingData[company.id].device_breakdown.desktop + 
                                 trackingData[company.id].device_breakdown.mobile + 
                                 trackingData[company.id].device_breakdown.tablet)) * 100)}%
                            </div>
                            <div className="text-gray-600">Mobile</div>
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                          Last viewed: {new Date(trackingData[company.id].last_viewed_at).toLocaleDateString()}
                        </div>
                      </div>
                    )}

                    {/* Image Customization */}
                    <div className="p-4">

                {/* ModernTrust Template Customization */}
                <div className="space-y-4 border-t pt-6">
                  <h4 className="font-medium text-gray-900">ModernTrust Template Images</h4>
                  
                  {/* Hero Image 1 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hero Background Image 1
                    </label>
                    <input
                      type="url"
                      placeholder={getCurrentImageUrl(company, 'hero_img') || "https://images.unsplash.com/photo-..."}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                      value={customizations[company.id]?.hero_img || ''}
                      onChange={(e) => handleCustomizationChange(company.id, 'hero_img', e.target.value)}
                    />
                    {getCurrentImageUrl(company, 'hero_img') && (
                      <p className="text-xs text-gray-500 mt-1">
                        Current: {getCurrentImageUrl(company, 'hero_img').substring(0, 50)}...
                      </p>
                    )}
                  </div>

                  {/* Hero Image 2 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hero Background Image 2 (Slideshow)
                    </label>
                    <input
                      type="url"
                      placeholder={getCurrentImageUrl(company, 'hero_img_2') || "https://images.unsplash.com/photo-..."}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                      value={customizations[company.id]?.hero_img_2 || ''}
                      onChange={(e) => handleCustomizationChange(company.id, 'hero_img_2', e.target.value)}
                    />
                    {getCurrentImageUrl(company, 'hero_img_2') && (
                      <p className="text-xs text-gray-500 mt-1">
                        Current: {getCurrentImageUrl(company, 'hero_img_2').substring(0, 50)}...
                      </p>
                    )}
                  </div>

                  {/* About Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      About Section Image
                    </label>
                    <input
                      type="url"
                      placeholder={getCurrentImageUrl(company, 'about_img') || "https://images.unsplash.com/photo-..."}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                      value={customizations[company.id]?.about_img || ''}
                      onChange={(e) => handleCustomizationChange(company.id, 'about_img', e.target.value)}
                    />
                    {getCurrentImageUrl(company, 'about_img') && (
                      <p className="text-xs text-gray-500 mt-1">
                        Current: {getCurrentImageUrl(company, 'about_img').substring(0, 50)}...
                      </p>
                    )}
                  </div>

                  {/* Logo URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Logo URL
                    </label>
                    <input
                      type="url"
                      placeholder={getCurrentImageUrl(company, 'logo_url') || "https://logo-url.com/logo.svg"}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                      value={customizations[company.id]?.logo_url || ''}
                      onChange={(e) => handleCustomizationChange(company.id, 'logo_url', e.target.value)}
                    />
                    {getCurrentImageUrl(company, 'logo_url') && (
                      <p className="text-xs text-gray-500 mt-1">
                        Current: {getCurrentImageUrl(company, 'logo_url').substring(0, 50)}...
                      </p>
                    )}
                  </div>

                  {/* Save Status */}
                  {saveStatus[company.id] && (
                    <div className={`p-3 rounded-md text-sm ${
                      saveStatus[company.id].includes('✅') ? 'bg-green-50 text-green-800' :
                      saveStatus[company.id].includes('❌') ? 'bg-red-50 text-red-800' :
                      saveStatus[company.id].includes('⚠️') ? 'bg-yellow-50 text-yellow-800' :
                      'bg-blue-50 text-blue-800'
                    }`}>
                      {saveStatus[company.id]}
                    </div>
                  )}

                  {/* Save Images Button */}
                  <button
                    onClick={() => saveCustomizations(company)}
                    disabled={saving[company.id]}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {saving[company.id] ? 'Saving...' : '💾 Save Images'}
                  </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredCompanies.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">No businesses found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const companies = await getAllCompanies(1000);
    
    // Filter for Alabama and Arkansas
    const filteredCompanies = companies
      .filter(company => company.state === 'Alabama' || company.state === 'Arkansas')
      .sort((a, b) => {
        if (a.state !== b.state) return a.state!.localeCompare(b.state!);
        if (a.city !== b.city) return (a.city || '').localeCompare(b.city || '');
        return a.name.localeCompare(b.name);
      });

    // Map companies with safe serialization
    const companiesWithTracking = filteredCompanies.map((company: any) => ({
      id: company.id,
      name: company.name,
      slug: company.slug,
      city: company.city || null,
      state: company.state || null,
      phone: company.phone || null,
      email_1: company.email_1 || null,
      tracking_enabled: company.tracking_enabled || false,
      company_frames: company.company_frames || null,
    }));

    return {
      props: {
        companies: companiesWithTracking,
      },
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      props: {
        companies: [],
      },
    };
  }
};