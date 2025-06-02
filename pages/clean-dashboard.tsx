import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { getAllCompanies } from '@/lib/supabase-db';
import { Company } from '@/types';

interface CompanyWithTracking extends Company {
  tracking_enabled?: boolean;
  total_views?: number;
  total_sessions?: number;
  last_viewed_at?: string;
}

interface CleanDashboardProps {
  companies: CompanyWithTracking[];
}

export default function CleanDashboard({ companies }: CleanDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [customizations, setCustomizations] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [trackingFilter, setTrackingFilter] = useState<'all' | 'enabled' | 'disabled'>('all');

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (company.city && company.city.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTracking = trackingFilter === 'all' ||
                           (trackingFilter === 'enabled' && company.tracking_enabled === true) ||
                           (trackingFilter === 'disabled' && company.tracking_enabled === false);
    return matchesSearch && matchesTracking;
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
      await fetch('/api/toggle-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: companyId, enabled: !currentStatus })
      });
      // Refresh page to show updated status
      window.location.reload();
    } catch (error) {
      alert('Error updating tracking status');
    }
  };

  const saveCustomizations = async (company: Company) => {
    setSaving(prev => ({ ...prev, [company.id!]: true }));
    
    try {
      const companyCustomizations = customizations[company.id!] || {};
      
      // Save images
      if (companyCustomizations.hero_img || companyCustomizations.hero_img_2 || companyCustomizations.about_img || companyCustomizations.logo) {
        await fetch('/api/template-customizations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId: company.id,
            customizations: {
              hero_img: companyCustomizations.hero_img || '',
              hero_img_2: companyCustomizations.hero_img_2 || '',
              about_img: companyCustomizations.about_img || '',
              logo_url: companyCustomizations.logo || ''
            }
          })
        });
      }

      // Save domain
      if (companyCustomizations.custom_domain) {
        await fetch('/api/manage-domain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId: company.id,
            customDomain: companyCustomizations.custom_domain
          })
        });
      }

      alert('✅ Customizations saved successfully!');
    } catch (error) {
      alert('❌ Error saving customizations');
    } finally {
      setSaving(prev => ({ ...prev, [company.id!]: false }));
    }
  };

  return (
    <>
      <Head>
        <title>Business Dashboard</title>
        <meta name="description" content="Clean business management dashboard" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Simple Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Business Dashboard</h1>
            <p className="text-gray-600 mt-2">{companies.length} businesses ready for customization</p>
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
              value={trackingFilter}
              onChange={(e) => setTrackingFilter(e.target.value as any)}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Businesses</option>
              <option value="enabled">Tracking On</option>
              <option value="disabled">Tracking Off</option>
            </select>
          </div>

          {/* Business Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredCompanies.map((company) => (
              <div key={company.id} className="bg-white rounded-lg shadow-sm border p-6">
                {/* Business Info */}
                <div className="mb-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">{company.name}</h3>
                    {company.tracking_enabled ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                        Tracking On
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                        Tracking Off
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600">{company.display_city || company.city}, {company.display_state || company.state}</p>
                  {company.phone && <p className="text-gray-600">{company.phone}</p>}
                  {company.email_1 && <p className="text-gray-600">{company.email_1}</p>}
                  
                  {/* Analytics Summary */}
                  {company.tracking_enabled && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Views: <span className="font-medium">{company.total_views || 0}</span></span>
                        <span className="text-gray-600">Sessions: <span className="font-medium">{company.total_sessions || 0}</span></span>
                      </div>
                      {company.last_viewed_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          Last viewed: {new Date(company.last_viewed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-3">
                    <Link 
                      href={`/t/moderntrust/${company.slug}`}
                      target="_blank"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Website →
                    </Link>
                    {company.tracking_enabled && company.total_views && (
                      <Link 
                        href={`/session-analytics?company=${company.id}`}
                        className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                      >
                        View Analytics →
                      </Link>
                    )}
                  </div>
                </div>

                {/* Customization Form */}
                <div className="space-y-4 border-t pt-6">
                  <h4 className="font-medium text-gray-900">Customize Template</h4>
                  
                  {/* Custom Domain */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom Domain</label>
                    <input
                      type="text"
                      placeholder="example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={customizations[String(company.id)]?.custom_domain || (company as any).custom_domain || ''}
                      onChange={(e) => handleCustomizationChange(String(company.id), 'custom_domain', e.target.value)}
                    />
                  </div>

                  {/* Hero Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hero Background Image</label>
                    <input
                      type="url"
                      placeholder="https://example.com/hero-image.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={customizations[String(company.id)]?.hero_img || ''}
                      onChange={(e) => handleCustomizationChange(String(company.id), 'hero_img', e.target.value)}
                    />
                  </div>

                  {/* Hero Image 2 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hero Image 2 (Slideshow)</label>
                    <input
                      type="url"
                      placeholder="https://example.com/hero2-image.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={customizations[String(company.id)]?.hero_img_2 || ''}
                      onChange={(e) => handleCustomizationChange(String(company.id), 'hero_img_2', e.target.value)}
                    />
                  </div>

                  {/* About Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">About Section Image</label>
                    <input
                      type="url"
                      placeholder="https://example.com/about-image.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={customizations[String(company.id)]?.about_img || ''}
                      onChange={(e) => handleCustomizationChange(String(company.id), 'about_img', e.target.value)}
                    />
                  </div>

                  {/* Logo URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                    <input
                      type="url"
                      placeholder="https://example.com/logo.svg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={customizations[String(company.id)]?.logo || ''}
                      onChange={(e) => handleCustomizationChange(String(company.id), 'logo', e.target.value)}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => toggleTracking(String(company.id), company.tracking_enabled || false)}
                      className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                        company.tracking_enabled
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {company.tracking_enabled ? 'Pause Tracking' : 'Start Tracking'}
                    </button>
                    <button
                      onClick={() => saveCustomizations(company)}
                      disabled={saving[company.id!]}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {saving[company.id!] ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
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
    const companies = await getAllCompanies(1000); // Get more companies
    
    // Filter for Alabama and Arkansas, then sort
    const filteredCompanies = companies
      .filter(company => company.state === 'Alabama' || company.state === 'Arkansas')
      .sort((a, b) => {
        // Sort by state, then city, then name
        if (a.state !== b.state) return a.state!.localeCompare(b.state!);
        if (a.city !== b.city) return (a.city || '').localeCompare(b.city || '');
        return a.name.localeCompare(b.name);
      });

    // Add tracking data and ensure no undefined values
    const companiesWithTracking = filteredCompanies.map((company: any) => ({
      id: company.id,
      name: company.name,
      slug: company.slug,
      city: company.city || null,
      state: company.state || null,
      display_city: company.display_city || null,
      display_state: company.display_state || null,
      phone: company.phone || null,
      email_1: company.email_1 || null,
      custom_domain: company.custom_domain || null,
      tracking_enabled: company.tracking_enabled || false,
      total_views: 0, // TODO: Get from template_views table
      total_sessions: 0, // TODO: Get from template_views table  
      last_viewed_at: null, // TODO: Get from template_views table
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