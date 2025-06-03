import { useState } from 'react';

interface Company {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  phone?: string;
  email_1?: string;
  site?: string;
  tracking_enabled?: boolean;
  custom_domain?: string;
  domain_verified?: boolean;
}

interface DomainManagementProps {
  company: Company;
  onUpdate: (company: Company) => void;
}

export default function DomainManagement({ company, onUpdate }: DomainManagementProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [domain, setDomain] = useState(company.custom_domain || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSaveDomain = async () => {
    if (!domain.trim()) {
      setError('Domain is required');
      return;
    }

    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!domainRegex.test(domain)) {
      setError('Invalid domain format. Example: yourcompany.com');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/manage-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: company.id, customDomain: domain })
      });

      const data = await response.json();

      if (response.ok) {
        // Update the company data
        const updatedCompany = { ...company, custom_domain: domain, domain_verified: false };
        onUpdate(updatedCompany);
        setIsOpen(false);
      } else {
        setError(data.message || 'Failed to save domain');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveDomain = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/manage-domain', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: company.id })
      });

      if (response.ok) {
        const updatedCompany = { ...company, custom_domain: undefined, domain_verified: false };
        onUpdate(updatedCompany);
        setDomain('');
        setIsOpen(false);
      }
    } catch (err) {
      setError('Failed to remove domain');
    } finally {
      setSaving(false);
    }
  };

  const getDNSInstructions = () => {
    return `To configure your domain ${domain}, add these DNS records:

CNAME Record:
Name: @ (or leave blank)
Value: cname.vercel-dns.com

Or A Records:
Name: @ (or leave blank)  
Value: 76.76.19.61

Name: www
Value: cname.vercel-dns.com

Wait 24-48 hours for DNS propagation.`;
  };

  return (
    <>
      {/* Domain Status Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          company.custom_domain 
            ? company.domain_verified 
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {company.custom_domain 
          ? company.domain_verified 
            ? `✓ ${company.custom_domain}`
            : `⚠ ${company.custom_domain}`
          : 'Add Domain'
        }
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Domain Management</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Domain for {company.name}
                </label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="yourcompany.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {error && (
                  <p className="text-red-500 text-sm mt-1">{error}</p>
                )}
              </div>

              {company.custom_domain && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">DNS Configuration</h4>
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                    {getDNSInstructions()}
                  </pre>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      company.domain_verified 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {company.domain_verified ? '✓ Verified' : '⚠ Not Verified'}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleSaveDomain}
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Domain'}
                </button>
                
                {company.custom_domain && (
                  <button
                    onClick={handleRemoveDomain}
                    disabled={saving}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="text-xs text-gray-500">
                <p><strong>Current URL:</strong> {window.location.origin}/t/moderntrust/{company.slug}</p>
                {domain && (
                  <p><strong>Custom URL:</strong> https://{domain}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}