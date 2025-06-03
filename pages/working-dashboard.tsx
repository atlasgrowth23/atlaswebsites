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
  site?: string;
  reviews_link?: string;
  rating?: number;
  reviews?: number;
  r_30?: number;
  r_60?: number;
  r_90?: number;
  r_365?: number;
  tracking_enabled?: boolean;
  tracking_paused?: boolean;
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
  const [siteFilter, setSiteFilter] = useState<'all' | 'has_site' | 'no_site'>('all');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, 'analytics' | 'customize'>>({});
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
    const matchesSite = siteFilter === 'all' ||
                       (siteFilter === 'has_site' && company.site) ||
                       (siteFilter === 'no_site' && !company.site);
    return matchesSearch && matchesTracking && matchesState && matchesSite;
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

  const toggleTracking = async (companyId: string, currentStatus: boolean, isPaused: boolean = false) => {
    try {
      const company = companies.find(c => c.id === companyId);
      let newStatus;
      let pausedStatus;
      
      if (currentStatus && !isPaused) {
        // Currently active -> pause it
        newStatus = true;
        pausedStatus = true;
      } else if (currentStatus && isPaused) {
        // Currently paused -> resume it
        newStatus = true;
        pausedStatus = false;
      } else {
        // Currently off -> turn on
        newStatus = true;
        pausedStatus = false;
      }

      const response = await fetch('/api/toggle-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          businessId: companyId, 
          enabled: newStatus,
          paused: pausedStatus
        })
      });
      
      if (response.ok) {
        if (newStatus && !pausedStatus) {
          await fetchTrackingData(companyId);
        }
        window.location.reload();
      } else {
        alert('Error updating tracking status');
      }
    } catch (error) {
      alert('Error updating tracking status');
    }
  };

  const fetchTrackingData = async (companyId: string) => {
    try {
      // Fetch real tracking data from multiple sources
      const [viewsRes, analyticsRes] = await Promise.all([
        fetch(`/api/template-views?companyId=${companyId}`),
        fetch(`/api/analytics-summary?companyId=${companyId}`)
      ]);
      
      let trackingData: any = {
        total_views: 0,
        total_sessions: 0,
        avg_time_seconds: 0,
        last_viewed_at: null,
        device_breakdown: {
          desktop: 0,
          mobile: 0,
          tablet: 0
        },
        recent_sessions: []
      };

      // Parse template views data
      if (viewsRes.ok) {
        const viewsData = await viewsRes.json();
        trackingData.total_views = viewsData.total_views || 0;
        trackingData.total_sessions = viewsData.unique_sessions || 0;
        trackingData.last_viewed_at = viewsData.last_viewed_at;
        trackingData.recent_sessions = viewsData.views || [];
      }

      // Parse analytics summary
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        trackingData.avg_time_seconds = analyticsData.avg_time_seconds || 0;
        trackingData.device_breakdown = analyticsData.device_breakdown || trackingData.device_breakdown;
      }
      
      setTrackingData(prev => ({
        ...prev,
        [companyId]: trackingData
      }));
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      // Set empty data on error instead of fake data
      setTrackingData(prev => ({
        ...prev,
        [companyId]: {
          total_views: 0,
          total_sessions: 0,
          avg_time_seconds: 0,
          last_viewed_at: null,
          device_breakdown: { desktop: 0, mobile: 0, tablet: 0 },
          recent_sessions: []
        }
      }));
    }
  };

  const toggleCardExpanded = (companyId: string) => {
    if (expandedCard === companyId) {
      setExpandedCard(null);
    } else {
      setExpandedCard(companyId);
      setActiveTab(prev => ({ ...prev, [companyId]: 'analytics' }));
      const company = companies.find(c => c.id === companyId);
      if (company?.tracking_enabled && !trackingData[companyId]) {
        fetchTrackingData(companyId);
      }
    }
  };

  const setTab = (companyId: string, tab: 'analytics' | 'customize') => {
    setActiveTab(prev => ({ ...prev, [companyId]: tab }));
  };

  const saveCustomizations = async (company: CompanyWithTracking) => {
    setSaving(prev => ({ ...prev, [company.id]: true }));
    setSaveStatus(prev => ({ ...prev, [company.id]: 'Saving...' }));
    
    try {
      const companyCustomizations = customizations[company.id] || {};
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

        if (response.ok) {
          setSaveStatus(prev => ({ ...prev, [company.id]: '✅ Saved successfully!' }));
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
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value as any)}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sites</option>
              <option value="has_site">Has Site</option>
              <option value="no_site">No Site</option>
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
                      {company.site ? (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                          Has Site
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                          No Site
                        </span>
                      )}
                      {company.tracking_enabled ? (
                        company.tracking_paused ? (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                            Tracking Paused
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                            Tracking On
                          </span>
                        )
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
                  
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-gray-600">{company.city}, {company.state}</p>
                      {company.phone && <p className="text-gray-600 text-sm">{company.phone}</p>}
                    </div>
                    {company.rating && (
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="font-medium">{company.rating}</span>
                          <span className="text-gray-500 text-sm">({company.reviews || 0})</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Link 
                      href={`/t/moderntrust/${company.slug}`}
                      target="_blank"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      🌐 View Website
                    </Link>
                    {company.site && (
                      <a 
                        href={company.site}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        🔗 Original Site
                      </a>
                    )}
                    {company.reviews_link && (
                      <a 
                        href={company.reviews_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        ⭐ Reviews
                      </a>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedCard === company.id && (
                  <div className="border-t bg-gray-50">
                    {/* Review Metrics */}
                    <div className="p-4 bg-white border-b">
                      <h4 className="font-medium text-gray-900 mb-3">📈 Review Metrics</h4>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="bg-gray-50 p-3 rounded text-center">
                          <div className="font-bold text-green-600">{company.r_30 || 0}</div>
                          <div className="text-gray-600">R30</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded text-center">
                          <div className="font-bold text-purple-600">{company.r_60 || 0}</div>
                          <div className="text-gray-600">R60</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded text-center">
                          <div className="font-bold text-orange-600">{company.r_90 || 0}</div>
                          <div className="text-gray-600">R90</div>
                        </div>
                      </div>
                      <div className="mt-2 text-center">
                        <div className="inline-block bg-gray-50 p-3 rounded">
                          <div className="font-bold text-red-600">{company.r_365 || 0}</div>
                          <div className="text-gray-600 text-sm">R365</div>
                        </div>
                      </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex bg-white border-b">
                      <button
                        onClick={() => setTab(company.id, 'analytics')}
                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                          activeTab[company.id] === 'analytics' || !activeTab[company.id]
                            ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        📊 Analytics & Tracking
                      </button>
                      <button
                        onClick={() => setTab(company.id, 'customize')}
                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                          activeTab[company.id] === 'customize'
                            ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        🎨 Customize Template
                      </button>
                    </div>

                    {/* Tab Content */}
                    {(activeTab[company.id] === 'analytics' || !activeTab[company.id]) && (
                      <div className="p-4 bg-white">
                        {/* Tracking Toggle */}
                        <div className="mb-4 space-y-2">
                          <button
                            onClick={() => toggleTracking(company.id, company.tracking_enabled || false, company.tracking_paused || false)}
                            className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                              company.tracking_enabled && !company.tracking_paused
                                ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                                : company.tracking_enabled && company.tracking_paused
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            {company.tracking_enabled && !company.tracking_paused ? '⏸️ Pause Tracking' :
                             company.tracking_enabled && company.tracking_paused ? '▶️ Resume Tracking' :
                             '▶️ Start Tracking'}
                          </button>
                          
                          {/* Stop Tracking Button - only show when paused */}
                          {company.tracking_enabled && company.tracking_paused && (
                            <button
                              onClick={() => {
                                // Force stop tracking completely
                                fetch('/api/toggle-tracking', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ 
                                    businessId: company.id, 
                                    enabled: false,
                                    paused: false
                                  })
                                }).then(() => window.location.reload());
                              }}
                              className="w-full py-2 px-4 rounded-md font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                            >
                              ❌ Stop Tracking Completely
                            </button>
                          )}
                        </div>

                        {/* Tracking Data */}
                        {company.tracking_enabled && trackingData[company.id] && (
                          <div className="space-y-4">
                            {/* Summary Stats */}
                            <div className="bg-blue-50 p-4 rounded-md">
                              <h5 className="font-medium text-gray-900 mb-3">Quick Stats</h5>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div className="bg-white p-3 rounded text-center">
                                  <div className="text-xl font-bold text-blue-600">
                                    {trackingData[company.id].total_views}
                                  </div>
                                  <div className="text-gray-600">Views</div>
                                </div>
                                <div className="bg-white p-3 rounded text-center">
                                  <div className="text-xl font-bold text-green-600">
                                    {trackingData[company.id].total_sessions}
                                  </div>
                                  <div className="text-gray-600">Sessions</div>
                                </div>
                                <div className="bg-white p-3 rounded text-center">
                                  <div className="text-xl font-bold text-purple-600">
                                    {Math.round(trackingData[company.id].avg_time_seconds)}s
                                  </div>
                                  <div className="text-gray-600">Avg Time</div>
                                </div>
                              </div>
                            </div>

                            {/* Recent Sessions */}
                            <div className="bg-white border rounded-md">
                              <div className="p-4 border-b">
                                <h5 className="font-medium text-gray-900">Recent Visits</h5>
                              </div>
                              <div className="max-h-64 overflow-y-auto">
                                {trackingData[company.id].recent_sessions && trackingData[company.id].recent_sessions.length > 0 ? (
                                  <div className="divide-y">
                                    {trackingData[company.id].recent_sessions
                                      .sort((a: any, b: any) => new Date(b.visit_start_time).getTime() - new Date(a.visit_start_time).getTime())
                                      .slice(0, 10)
                                      .map((session: any, index: number) => (
                                      <div key={index} className="p-3 hover:bg-gray-50">
                                        <div className="flex justify-between items-start">
                                          <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-900">
                                              Session {session.session_id?.split('_')[1]?.substring(0, 8)}...
                                              {session.is_initial_visit && (
                                                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                                  First Visit
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                              {session.ip_address && `${session.ip_address} • `}
                                              {session.device_type} • {session.browser_name}
                                              {session.city && ` • ${session.city}, ${session.country}`}
                                            </div>
                                            <div className="flex gap-3 mt-1">
                                              {session.total_time_seconds > 0 && (
                                                <div className="text-xs text-blue-600">
                                                  ⏱️ {Math.round(session.total_time_seconds)}s
                                                </div>
                                              )}
                                              {session.page_interactions > 0 && (
                                                <div className="text-xs text-purple-600">
                                                  🖱️ {session.page_interactions} interactions
                                                </div>
                                              )}
                                            </div>
                                            {session.referrer_url && (
                                              <div className="text-xs text-gray-400 mt-1 truncate">
                                                From: {session.referrer_url}
                                              </div>
                                            )}
                                          </div>
                                          <div className="text-right">
                                            <div className="text-xs text-gray-500">
                                              {new Date(session.visit_start_time).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                              {new Date(session.visit_start_time).toLocaleTimeString()}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="p-6 text-center text-gray-500">
                                    <p>No recent visits yet</p>
                                    <p className="text-sm">Visitors will appear here when they view the website</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {company.tracking_enabled && !trackingData[company.id] && (
                          <div className="text-center py-8 text-gray-500">
                            <p>No tracking data available yet.</p>
                            <p className="text-sm">
                              {company.tracking_paused ? 
                                'Resume tracking to continue collecting data.' : 
                                'Start getting visitors to see analytics here!'}
                            </p>
                          </div>
                        )}

                        {!company.tracking_enabled && (
                          <div className="text-center py-8 text-gray-500">
                            <p>Tracking is currently disabled.</p>
                            <p className="text-sm">Enable tracking above to start collecting analytics.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab[company.id] === 'customize' && (
                      <div className="p-4 bg-white">
                        <h5 className="font-medium text-gray-900 mb-4">🖼️ ModernTrust Template Images</h5>
                        
                        <div className="space-y-4">
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
                    )}
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
      site: company.site || null,
      reviews_link: company.reviews_link || null,
      rating: company.rating || null,
      reviews: company.reviews || null,
      r_30: company.r_30 || null,
      r_60: company.r_60 || null,
      r_90: company.r_90 || null,
      r_365: company.r_365 || null,
      tracking_enabled: company.tracking_enabled || false,
      tracking_paused: company.tracking_paused || false,
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