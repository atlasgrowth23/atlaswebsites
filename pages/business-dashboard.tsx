import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { query } from '@/lib/db';
import { cacheHelpers } from '@/lib/cache';

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
  reviews_link?: string;
}

interface BusinessDashboardProps {
  businesses: Business[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export default function BusinessDashboard({ businesses, totalCount, currentPage, totalPages }: BusinessDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState<'all' | 'Alabama' | 'Arkansas'>('all');
  const [siteFilter, setSiteFilter] = useState<'all' | 'has_site' | 'no_site'>('all');
  const [trackingFilter, setTrackingFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [minRating, setMinRating] = useState('');
  const [maxRating, setMaxRating] = useState('');
  const [minReviews, setMinReviews] = useState('');
  const [maxReviews, setMaxReviews] = useState('');
  const [minPhotos, setMinPhotos] = useState('');
  const [maxPhotos, setMaxPhotos] = useState('');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [customizations, setCustomizations] = useState({
    custom_domain: '',
    hero_img: '',
    hero_img_2: '',
    about_img: '',
    logo: ''
  });
  const [imagePreviewErrors, setImagePreviewErrors] = useState<{[key: string]: boolean}>({});
  const [logoProcessingStatus, setLogoProcessingStatus] = useState<{[key: string]: string}>({});

  // Initialize form with current database values when expanding a card
  const initializeCustomizations = (business: Business) => {
    const currentValues = {
      custom_domain: (business as any).custom_domain || '',
      hero_img: getBusinessFrameUrl(business, 'hero_img') || '',
      hero_img_2: getBusinessFrameUrl(business, 'hero_img_2') || '',
      about_img: getBusinessFrameUrl(business, 'about_img') || '',
      logo: getBusinessLogoUrl(business) || ''
    };
    
    console.log('Initializing customizations for', business.name, currentValues);
    setCustomizations(currentValues);
    setImagePreviewErrors({});
  };

  // Handle image preview error
  const handleImageError = (imageKey: string) => {
    setImagePreviewErrors(prev => ({ ...prev, [imageKey]: true }));
  };

  // Check if image URL is valid for preview
  const isValidImageUrl = (url: string) => {
    return url && url.trim() !== '' && !imagePreviewErrors[url];
  };

  // Poll for logo processing completion
  const pollLogoProcessing = async (jobId: string, businessId: string) => {
    const maxAttempts = 60; // 5 minutes max (60 * 5 seconds)
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setLogoProcessingStatus(prev => ({ ...prev, [businessId]: 'timeout' }));
        return;
      }

      try {
        const response = await fetch(`/api/logo-job-status?jobId=${jobId}`);
        const result = await response.json();

        if (result.success && result.job) {
          const { status } = result.job;
          
          if (status === 'completed') {
            setLogoProcessingStatus(prev => ({ ...prev, [businessId]: 'completed' }));
            setTimeout(() => window.location.reload(), 1000);
            return;
          } else if (status === 'failed') {
            setLogoProcessingStatus(prev => ({ ...prev, [businessId]: 'failed' }));
            return;
          }
        }

        attempts++;
        setTimeout(poll, 5000); // Poll every 5 seconds
      } catch (error) {
        console.error('Error polling logo status:', error);
        setTimeout(poll, 5000);
      }
    };

    poll();
  };

  // Helper functions to get current business images from database
  const getBusinessFrameUrl = (business: Business, frameName: string) => {
    // First check if we have frame data loaded
    const frames = (business as any).frames || {};
    return frames[frameName] || '';
  };

  const getBusinessLogoUrl = (business: Business) => {
    const frames = (business as any).frames || {};
    return frames['logo_url'] || '';
  };

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         business.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = stateFilter === 'all' || business.state === stateFilter;
    const matchesSite = siteFilter === 'all' || 
                       (siteFilter === 'has_site' && (business as any).site) ||
                       (siteFilter === 'no_site' && !(business as any).site);
    const matchesTracking = trackingFilter === 'all' ||
                           (trackingFilter === 'enabled' && business.tracking_enabled === true) ||
                           (trackingFilter === 'disabled' && business.tracking_enabled === false);
    
    // Rating filters
    const rating = parseFloat((business as any).rating) || 0;
    const matchesMinRating = !minRating || rating >= parseFloat(minRating);
    const matchesMaxRating = !maxRating || rating <= parseFloat(maxRating);
    
    // Review filters
    const reviews = parseInt((business as any).reviews) || 0;
    const matchesMinReviews = !minReviews || reviews >= parseInt(minReviews);
    const matchesMaxReviews = !maxReviews || reviews <= parseInt(maxReviews);
    
    // Photo filters
    const photos = parseInt((business as any).photos_count) || 0;
    const matchesMinPhotos = !minPhotos || photos >= parseInt(minPhotos);
    const matchesMaxPhotos = !maxPhotos || photos <= parseInt(maxPhotos);
    
    return matchesSearch && matchesState && matchesSite && matchesTracking &&
           matchesMinRating && matchesMaxRating && matchesMinReviews && 
           matchesMaxReviews && matchesMinPhotos && matchesMaxPhotos;
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
      // Auto-add image domains to Next.js config
      const imageUrls = [customizations.hero_img, customizations.hero_img_2, customizations.about_img, customizations.logo]
        .filter(url => url && url.trim() !== '');
      
      for (const imageUrl of imageUrls) {
        try {
          await fetch('/api/update-image-domains', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl })
          });
        } catch (error) {
          console.log('Note: Could not auto-add domain for', imageUrl);
        }
      }

      // Process logo asynchronously if provided
      let processedLogoUrl = customizations.logo;
      let logoJobId = null;
      
      if (customizations.logo && customizations.logo.trim() !== '') {
        try {
          // Start async logo processing
          const logoResponse = await fetch('/api/process-logo-async', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              companySlug: business.slug,
              logoUrl: customizations.logo
            })
          });
          const logoResult = await logoResponse.json();
          if (logoResult.jobId) {
            logoJobId = logoResult.jobId;
            setLogoProcessingStatus(prev => ({ ...prev, [business.id]: 'processing' }));
          }
        } catch (error) {
          console.log('Note: Could not queue logo processing, using original URL');
        }
      }

      // Only save fields that have values to preserve existing customizations
      const fieldsToUpdate: any = {};
      
      if (customizations.hero_img && customizations.hero_img.trim()) {
        fieldsToUpdate.hero_img = customizations.hero_img;
      }
      if (customizations.hero_img_2 && customizations.hero_img_2.trim()) {
        fieldsToUpdate.hero_img_2 = customizations.hero_img_2;
      }
      if (customizations.about_img && customizations.about_img.trim()) {
        fieldsToUpdate.about_img = customizations.about_img;
      }
      if (processedLogoUrl && processedLogoUrl.trim()) {
        fieldsToUpdate.logo_url = processedLogoUrl;
      }

      // Save images
      await fetch('/api/template-customizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: business.id,
          customizations: fieldsToUpdate
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

      if (logoJobId) {
        alert('✅ Customizations saved! Logo is being processed in the background. Page will refresh when complete.');
        // Poll for logo completion
        pollLogoProcessing(logoJobId, business.id);
      } else {
        alert('✅ Customizations saved! Image domains automatically added to config.');
        setExpandedCard(null);
        window.location.reload();
      }
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
            <p className="text-gray-600 mt-2">{filteredBusinesses.length} of {totalCount} businesses (Page {currentPage} of {totalPages})</p>
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
                <option value="all">All Websites</option>
                <option value="has_site">Has Website</option>
                <option value="no_site">No Website</option>
              </select>
              <select
                value={trackingFilter}
                onChange={(e) => setTrackingFilter(e.target.value as any)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Tracking</option>
                <option value="enabled">Tracking On</option>
                <option value="disabled">Tracking Off</option>
              </select>
            </div>
            
            {/* Numeric Filters Row */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Min Rating</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  placeholder="0"
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">Max Rating</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  placeholder="5"
                  value={maxRating}
                  onChange={(e) => setMaxRating(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">Min Reviews</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={minReviews}
                  onChange={(e) => setMinReviews(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">Max Reviews</label>
                <input
                  type="number"
                  min="0"
                  placeholder="∞"
                  value={maxReviews}
                  onChange={(e) => setMaxReviews(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">Min Photos</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={minPhotos}
                  onChange={(e) => setMinPhotos(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">Max Photos</label>
                <input
                  type="number"
                  min="0"
                  placeholder="∞"
                  value={maxPhotos}
                  onChange={(e) => setMaxPhotos(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-md"
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-500">
                Showing {filteredBusinesses.length} of {businesses.length} businesses
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Filters are already applied in real-time, this just provides visual feedback
                    const filteredCount = filteredBusinesses.length;
                    alert(`Filters applied! Showing ${filteredCount} businesses.`);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 font-medium"
                >
                  Apply Filters
                </button>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStateFilter('all');
                    setSiteFilter('all');
                    setTrackingFilter('all');
                    setMinRating('');
                    setMaxRating('');
                    setMinReviews('');
                    setMaxReviews('');
                    setMinPhotos('');
                    setMaxPhotos('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Clear All Filters
                </button>
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
                  onClick={() => {
                    const newExpandedId = expandedCard === business.id ? null : business.id;
                    setExpandedCard(newExpandedId);
                    if (newExpandedId) {
                      initializeCustomizations(business);
                    }
                  }}
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
                    
                    {/* Website URL */}
                    {(business as any).site ? (
                      <p><strong>Website:</strong> <a href={(business as any).site} target="_blank" className="text-blue-600 hover:underline">{(business as any).site}</a></p>
                    ) : (
                      <p><strong>Website:</strong> <span className="text-gray-400">No website</span></p>
                    )}
                    
                    {/* Reviews Link */}
                    {(business.reviews_link || (business as any).location_reviews_link) && (
                      <p><strong>Reviews:</strong> <a href={business.reviews_link || (business as any).location_reviews_link} target="_blank" className="text-blue-600 hover:underline">View on Google</a></p>
                    )}
                    
                    {(business.total_views || 0) > 0 && (
                      <p><strong>Analytics:</strong> <Link href={`/session-analytics?company=${business.id}`} className="text-blue-600 hover:underline">View Sessions</Link></p>
                    )}
                    
                    {/* Reviews & Rating */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <p><strong>Rating:</strong> {(business as any).rating || 'N/A'}/5</p>
                      <p><strong>Total Reviews:</strong> {(business as any).reviews || 0}</p>
                      <p><strong>Photos:</strong> {(business as any).photos_count || 0}</p>
                      <p><strong>Views:</strong> {business.total_views || 0}</p>
                    </div>
                    
                    {/* Review Timeline */}
                    <div className="grid grid-cols-4 gap-1 text-xs bg-gray-50 p-2 rounded">
                      <div className="text-center">
                        <div className="font-semibold">{(business as any).r_30 || 0}</div>
                        <div className="text-gray-500">30d</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{(business as any).r_60 || 0}</div>
                        <div className="text-gray-500">60d</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{(business as any).r_90 || 0}</div>
                        <div className="text-gray-500">90d</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{(business as any).r_365 || 0}</div>
                        <div className="text-gray-500">1yr</div>
                      </div>
                    </div>
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
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">{business.total_views || 0}</div>
                              <div className="text-xs text-gray-500">Total Views</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">{(business as any).total_sessions || 0}</div>
                              <div className="text-xs text-gray-500">Sessions</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">
                                {(business as any).avg_time_seconds ? `${Math.round((business as any).avg_time_seconds)}s` : '0s'}
                              </div>
                              <div className="text-xs text-gray-500">Avg Time</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-orange-600">
                                {business.tracking_enabled ? 'Active' : 'Paused'}
                              </div>
                              <div className="text-xs text-gray-500">Status</div>
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

                          </div>
                        </div>
                      </div>

                      {/* Website Customization */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-4 text-lg">🎨 Website Customization</h4>
                        <div className="bg-white p-6 rounded-lg border shadow-sm">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Hero Image 1 URL</label>
                              <input
                                type="url"
                                placeholder="https://example.com/hero1.jpg"
                                className="w-full px-3 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={customizations.hero_img || getBusinessFrameUrl(business, 'hero_img') || ''}
                                onChange={(e) => setCustomizations({...customizations, hero_img: e.target.value})}
                              />
                              <div className="mt-2 grid grid-cols-2 gap-4">
                                {getBusinessFrameUrl(business, 'hero_img') && (
                                  <div>
                                    <img src={getBusinessFrameUrl(business, 'hero_img')} alt="Current hero" className="w-full h-20 object-cover rounded border" />
                                    <p className="text-xs text-gray-500 mt-1">Current</p>
                                  </div>
                                )}
                                {isValidImageUrl(customizations.hero_img) && customizations.hero_img !== getBusinessFrameUrl(business, 'hero_img') && (
                                  <div>
                                    <img 
                                      src={customizations.hero_img} 
                                      alt="Preview hero" 
                                      className="w-full h-20 object-cover rounded border" 
                                      onError={() => handleImageError(customizations.hero_img)}
                                    />
                                    <p className="text-xs text-green-600 mt-1">Preview</p>
                                  </div>
                                )}
                              </div>
                              {imagePreviewErrors[customizations.hero_img] && (
                                <p className="text-xs text-red-500 mt-1">⚠️ Unable to load image preview</p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Hero Image 2 URL (Slideshow)</label>
                              <input
                                type="url"
                                placeholder="https://example.com/hero2.jpg"
                                className="w-full px-3 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={customizations.hero_img_2 || getBusinessFrameUrl(business, 'hero_img_2') || ''}
                                onChange={(e) => setCustomizations({...customizations, hero_img_2: e.target.value})}
                              />
                              <div className="mt-2 grid grid-cols-2 gap-4">
                                {getBusinessFrameUrl(business, 'hero_img_2') && (
                                  <div>
                                    <img src={getBusinessFrameUrl(business, 'hero_img_2')} alt="Current hero 2" className="w-full h-20 object-cover rounded border" />
                                    <p className="text-xs text-gray-500 mt-1">Current</p>
                                  </div>
                                )}
                                {isValidImageUrl(customizations.hero_img_2) && customizations.hero_img_2 !== getBusinessFrameUrl(business, 'hero_img_2') && (
                                  <div>
                                    <img 
                                      src={customizations.hero_img_2} 
                                      alt="Preview hero 2" 
                                      className="w-full h-20 object-cover rounded border" 
                                      onError={() => handleImageError(customizations.hero_img_2)}
                                    />
                                    <p className="text-xs text-green-600 mt-1">Preview</p>
                                  </div>
                                )}
                              </div>
                              {imagePreviewErrors[customizations.hero_img_2] && (
                                <p className="text-xs text-red-500 mt-1">⚠️ Unable to load image preview</p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">About Image URL</label>
                              <input
                                type="url"
                                placeholder="https://example.com/about.jpg"
                                className="w-full px-3 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={customizations.about_img || getBusinessFrameUrl(business, 'about_img') || ''}
                                onChange={(e) => setCustomizations({...customizations, about_img: e.target.value})}
                              />
                              <div className="mt-2 grid grid-cols-2 gap-4">
                                {getBusinessFrameUrl(business, 'about_img') && (
                                  <div>
                                    <img src={getBusinessFrameUrl(business, 'about_img')} alt="Current about" className="w-full h-20 object-cover rounded border" />
                                    <p className="text-xs text-gray-500 mt-1">Current</p>
                                  </div>
                                )}
                                {isValidImageUrl(customizations.about_img) && customizations.about_img !== getBusinessFrameUrl(business, 'about_img') && (
                                  <div>
                                    <img 
                                      src={customizations.about_img} 
                                      alt="Preview about" 
                                      className="w-full h-20 object-cover rounded border" 
                                      onError={() => handleImageError(customizations.about_img)}
                                    />
                                    <p className="text-xs text-green-600 mt-1">Preview</p>
                                  </div>
                                )}
                              </div>
                              {imagePreviewErrors[customizations.about_img] && (
                                <p className="text-xs text-red-500 mt-1">⚠️ Unable to load image preview</p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
                              <input
                                type="url"
                                placeholder="https://example.com/logo.svg"
                                className="w-full px-3 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={customizations.logo || getBusinessLogoUrl(business) || ''}
                                onChange={(e) => setCustomizations({...customizations, logo: e.target.value})}
                              />
                              <div className="mt-2 grid grid-cols-2 gap-4">
                                {getBusinessLogoUrl(business) && (
                                  <div>
                                    <img src={getBusinessLogoUrl(business)} alt="Current logo" className="w-full h-16 object-contain rounded border" />
                                    <p className="text-xs text-gray-500 mt-1">Current</p>
                                  </div>
                                )}
                                {isValidImageUrl(customizations.logo) && customizations.logo !== getBusinessLogoUrl(business) && (
                                  <div>
                                    <img 
                                      src={customizations.logo} 
                                      alt="Preview logo" 
                                      className="w-full h-16 object-contain rounded border" 
                                      onError={() => handleImageError(customizations.logo)}
                                    />
                                    <p className="text-xs text-green-600 mt-1">Preview</p>
                                  </div>
                                )}
                              </div>
                              {imagePreviewErrors[customizations.logo] && (
                                <p className="text-xs text-red-500 mt-1">⚠️ Unable to load image preview</p>
                              )}
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
                    <div className="mt-6 flex justify-between items-center">
                      {logoProcessingStatus[business.id] && (
                        <div className="flex items-center text-sm">
                          {logoProcessingStatus[business.id] === 'processing' && (
                            <span className="text-blue-600">
                              🔄 Processing logo...
                            </span>
                          )}
                          {logoProcessingStatus[business.id] === 'completed' && (
                            <span className="text-green-600">
                              ✅ Logo processed successfully!
                            </span>
                          )}
                          {logoProcessingStatus[business.id] === 'failed' && (
                            <span className="text-red-600">
                              ❌ Logo processing failed
                            </span>
                          )}
                          {logoProcessingStatus[business.id] === 'timeout' && (
                            <span className="text-orange-600">
                              ⏱️ Logo processing taking longer than expected
                            </span>
                          )}
                        </div>
                      )}
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.location.href = `?page=${currentPage - 1}`}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    const isCurrentPage = pageNum === currentPage;
                    const showPage = pageNum === 1 || pageNum === totalPages || 
                                   (pageNum >= currentPage - 2 && pageNum <= currentPage + 2);
                    
                    if (!showPage) {
                      if (pageNum === currentPage - 3 || pageNum === currentPage + 3) {
                        return <span key={pageNum} className="px-2">...</span>;
                      }
                      return null;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => window.location.href = `?page=${pageNum}`}
                        className={`px-3 py-2 border rounded-md ${
                          isCurrentPage 
                            ? 'bg-blue-500 text-white border-blue-500' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => window.location.href = `?page=${currentPage + 1}`}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const page = parseInt(context.query.page as string) || 1;
    const limit = 20; // Show 20 businesses per page

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM companies c
      WHERE (c.state = 'Alabama' OR c.state = 'Arkansas')
    `);
    const totalCount = parseInt(countResult.rows[0]?.total || '0');
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated data using cache
    const businessRows = await cacheHelpers.getBusinessList(page, limit);

    // Convert dates to strings for serialization and ensure required fields
    const businesses = businessRows.map((business: any) => ({
      ...business,
      total_views: business.total_views || 0,
      last_viewed_at: business.last_viewed_at ? (business.last_viewed_at instanceof Date ? business.last_viewed_at.toISOString() : business.last_viewed_at) : null,
    }));

    return {
      props: {
        businesses,
        totalCount,
        currentPage: page,
        totalPages,
      },
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      props: {
        businesses: [],
        totalCount: 0,
        currentPage: 1,
        totalPages: 1,
      },
    };
  }
};