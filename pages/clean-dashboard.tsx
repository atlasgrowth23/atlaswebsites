import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { query } from '@/lib/db';
import { Company } from '@/types';

interface CleanDashboardProps {
  companies: Company[];
}

export default function CleanDashboard({ companies }: CleanDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [customizations, setCustomizations] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (company.city && company.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
    setSaving(prev => ({ ...prev, [company.id!]: true }));
    
    try {
      const companyCustomizations = customizations[company.id!] || {};
      
      // Save images
      if (companyCustomizations.hero_img || companyCustomizations.about_img) {
        await fetch('/api/template-customizations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId: company.id,
            customizations: {
              hero_img: companyCustomizations.hero_img || '',
              about_img: companyCustomizations.about_img || ''
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
          {/* Search */}
          <div className="mb-8">
            <input
              type="text"
              placeholder="Search businesses..."
              className="w-full max-w-md px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Business Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredCompanies.map((company) => (
              <div key={company.id} className="bg-white rounded-lg shadow-sm border p-6">
                {/* Business Info */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">{company.name}</h3>
                  <p className="text-gray-600">{company.display_city || company.city}, {company.display_state || company.state}</p>
                  {company.phone && <p className="text-gray-600">{company.phone}</p>}
                  {company.email_1 && <p className="text-gray-600">{company.email_1}</p>}
                  <div className="flex gap-2 mt-3">
                    <Link 
                      href={`/t/moderntrust/${company.slug}`}
                      target="_blank"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View Website →
                    </Link>
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

                  {/* Save Button */}
                  <button
                    onClick={() => saveCustomizations(company)}
                    disabled={saving[company.id!]}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving[company.id!] ? 'Saving...' : 'Save Customizations'}
                  </button>
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
    const result = await query(`
      SELECT *
      FROM companies
      WHERE (state = 'Alabama' OR state = 'Arkansas')
      ORDER BY state, city, name
    `);

    const companies = result.rows || [];

    return {
      props: {
        companies,
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