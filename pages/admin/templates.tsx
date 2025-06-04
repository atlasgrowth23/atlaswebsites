import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import AdminLayout from '@/components/AdminLayout';
import DomainManagement from '@/components/DomainManagement';
import { getAllCompanies } from '@/lib/supabase-db';

interface Company {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  phone?: string;
  email_1?: string;
  site?: string;
  custom_domain?: string;
  domain_verified?: boolean;
}

interface TemplatesProps {
  companies: Company[];
}

export default function Templates({ companies }: TemplatesProps) {
  const [selectedState, setSelectedState] = useState<'Alabama' | 'Arkansas'>('Alabama');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [customizations, setCustomizations] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, string>>({});

  const filteredCompanies = companies.filter(company => {
    const matchesState = company.state === selectedState;
    if (!searchTerm) return matchesState;
    
    const searchLower = searchTerm.toLowerCase();
    return matchesState && (
      company.name.toLowerCase().includes(searchLower) ||
      company.city.toLowerCase().includes(searchLower) ||
      company.phone?.toLowerCase().includes(searchLower)
    );
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

  const saveCustomizations = async (company: Company) => {
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

        if (response.ok) {
          setSaveStatus(prev => ({ ...prev, [company.id]: '✅ Saved!' }));
          setTimeout(() => {
            setSaveStatus(prev => ({ ...prev, [company.id]: '' }));
            setCustomizations(prev => ({ ...prev, [company.id]: {} }));
          }, 2000);
        } else {
          setSaveStatus(prev => ({ ...prev, [company.id]: '❌ Error saving' }));
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

  return (
    <AdminLayout currentPage="templates">
      <Head>
        <title>Templates - Lead Management</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Templates & Domains</h1>
          <p className="text-gray-600">Customize website templates and manage custom domains</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* State Toggle */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setSelectedState('Alabama')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedState === 'Alabama'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Alabama
            </button>
            <button
              onClick={() => setSelectedState('Arkansas')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedState === 'Arkansas'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Arkansas
            </button>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search companies..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Companies Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Companies ({filteredCompanies.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredCompanies.map(company => (
              <div key={company.id} className="p-6">
                {/* Company Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{company.name}</h3>
                    <p className="text-gray-600">{company.city}, {company.state}</p>
                    {company.phone && (
                      <p className="text-sm text-gray-500">{company.phone}</p>
                    )}
                  </div>
                  
                  <div className="flex space-x-3">
                    <a
                      href={`/t/moderntrust/${company.slug}`}
                      target="_blank"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Site
                    </a>
                    <DomainManagement 
                      company={company}
                      onUpdate={(updatedCompany) => {
                        // Handle domain update if needed
                      }}
                    />
                  </div>
                </div>

                {/* Template Customization Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Hero Image 1 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hero Background Image 1
                    </label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                      value={customizations[company.id]?.hero_img || ''}
                      onChange={(e) => handleCustomizationChange(company.id, 'hero_img', e.target.value)}
                    />
                  </div>

                  {/* Hero Image 2 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hero Background Image 2
                    </label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                      value={customizations[company.id]?.hero_img_2 || ''}
                      onChange={(e) => handleCustomizationChange(company.id, 'hero_img_2', e.target.value)}
                    />
                  </div>

                  {/* About Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      About Section Image
                    </label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                      value={customizations[company.id]?.about_img || ''}
                      onChange={(e) => handleCustomizationChange(company.id, 'about_img', e.target.value)}
                    />
                  </div>

                  {/* Logo URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Logo URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://logo-url.com/logo.svg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                      value={customizations[company.id]?.logo_url || ''}
                      onChange={(e) => handleCustomizationChange(company.id, 'logo_url', e.target.value)}
                    />
                  </div>
                </div>

                {/* Save Status */}
                {saveStatus[company.id] && (
                  <div className={`mt-4 p-3 rounded-md text-sm ${
                    saveStatus[company.id].includes('✅') ? 'bg-green-50 text-green-800' :
                    saveStatus[company.id].includes('❌') ? 'bg-red-50 text-red-800' :
                    saveStatus[company.id].includes('⚠️') ? 'bg-yellow-50 text-yellow-800' :
                    'bg-blue-50 text-blue-800'
                  }`}>
                    {saveStatus[company.id]}
                  </div>
                )}

                {/* Save Button */}
                <div className="mt-4">
                  <button
                    onClick={() => saveCustomizations(company)}
                    disabled={saving[company.id]}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                  >
                    {saving[company.id] ? 'Saving...' : 'Save Template Changes'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {filteredCompanies.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <p>No companies found</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const companies = await getAllCompanies(1000);
    
    const filteredCompanies = companies
      .filter(company => company.state === 'Alabama' || company.state === 'Arkansas')
      .map((company: any) => ({
        id: company.id,
        name: company.name,
        slug: company.slug,
        city: company.city || null,
        state: company.state || null,
        phone: company.phone || null,
        email_1: company.email_1 || null,
        site: company.site || null,
        custom_domain: company.custom_domain || null,
        domain_verified: company.domain_verified || false,
      }));

    return {
      props: {
        companies: filteredCompanies,
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