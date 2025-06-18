import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import { getCompanyBySlug } from '@/lib/supabase-db';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Company {
  id: string;
  name: string;
  slug: string;
  email_1?: string;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  status: 'new_lead' | 'existing_customer';
  source: string;
  created_at: string;
  updated_at: string;
}

interface Activity {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
}

export default function HVACContacts() {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'new_leads' | 'existing_customers'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(true); // Start with demo mode for showcase

  // Load company on router ready
  useEffect(() => {
    if (router.isReady) {
      loadCompany();
    }
  }, [router.isReady]);

  // Load contacts when company or demo mode changes
  useEffect(() => {
    if (company) {
      loadContacts();
    }
  }, [company, demoMode]);

  // Load activities when contact is selected
  useEffect(() => {
    if (selectedContact && company) {
      loadActivities(selectedContact.id);
    }
  }, [selectedContact, company]);

  const loadCompany = async () => {
    try {
      const companySlug = router.query.company as string;
      
      if (!companySlug) {
        setError('Company parameter is required. Please access via ?company=your-company-slug');
        setLoading(false);
        return;
      }

      const companyData = await getCompanyBySlug(companySlug);
      
      if (!companyData) {
        setError(`Company not found: ${companySlug}`);
        setLoading(false);
        return;
      }

      setCompany(companyData);
      setError(null);
    } catch (err) {
      console.error('Error loading company:', err);
      setError('Failed to load company');
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    if (!company) return;
    
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('hvac_contacts')
        .select('*')
        .eq('company_id', company.id)
        .eq('is_demo', demoMode)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setContacts(data || []);
    } catch (err) {
      console.error('Error loading contacts:', err);
      setError('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async (contactId: string) => {
    if (!company) return;
    
    try {
      const { data, error } = await supabase
        .from('hvac_contact_activities')
        .select('*')
        .eq('contact_id', contactId)
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setActivities(data || []);
    } catch (err) {
      console.error('Error loading activities:', err);
      setActivities([]);
    }
  };


  const filteredContacts = contacts.filter(contact => {
    if (activeTab === 'new_leads') return contact.status === 'new_lead';
    if (activeTab === 'existing_customers') return contact.status === 'existing_customer';
    return true;
  });

  const getStatusBadge = (status: string) => {
    if (status === 'new_lead') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">New Lead</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Customer</span>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            {company ? `${company.name} - HVAC Dashboard` : 'HVAC Dashboard'}
          </h1>
          
          {/* Demo Mode Toggle */}
          <div className="flex items-center space-x-3">
            {company && (
              <button
                onClick={() => window.open(`https://atlasgrowth.ai/${company.slug}`, '_blank')}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View Website
              </button>
            )}
            <span className="text-sm font-medium text-gray-700">Demo Mode</span>
            <button
              onClick={() => setDemoMode(!demoMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                demoMode ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  demoMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-gray-500">
              {demoMode ? 'Demo Data' : 'Live Data'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => router.push('/hvac/contacts')}
              className="w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg bg-blue-50 text-blue-700 border border-blue-200"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Contacts
            </button>
            <button
              onClick={() => router.push(`/hvac/messages?company=${router.query.company}`)}
              className="w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Messages
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Contact List */}
          <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
            {/* Contact List Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>
                <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Contact
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'all'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveTab('new_leads')}
                  className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'new_leads'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  New Leads
                </button>
                <button
                  onClick={() => setActiveTab('existing_customers')}
                  className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'existing_customers'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Customers
                </button>
              </div>

              {/* Search */}
              <div className="mt-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search contacts..."
                  />
                </div>
              </div>
            </div>

            {/* Contact List Items */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-gray-500">Loading contacts...</div>
              ) : error ? (
                <div className="p-6 text-center text-red-500">{error}</div>
              ) : filteredContacts.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  {activeTab === 'all' ? 'No contacts yet' : `No ${activeTab.replace('_', ' ')} found`}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedContact?.id === contact.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="text-sm font-semibold text-gray-900">
                              {contact.first_name} {contact.last_name}
                            </h4>
                            {getStatusBadge(contact.status)}
                          </div>
                          <div className="space-y-1">
                            {contact.phone && (
                              <p className="text-xs text-gray-600 flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {contact.phone}
                              </p>
                            )}
                            {contact.email && (
                              <p className="text-xs text-gray-600 flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {contact.email}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 text-right">
                          {formatDate(contact.updated_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Contact Details */}
          <div className="flex-1 bg-white">
            {selectedContact ? (
              <div className="h-full flex flex-col">
                {/* Contact Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {selectedContact.first_name} {selectedContact.last_name}
                      </h2>
                      <div className="flex items-center space-x-3 mt-2">
                        {getStatusBadge(selectedContact.status)}
                        <span className="text-sm text-gray-500">
                          Created {formatDate(selectedContact.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Edit
                      </button>
                    </div>
                  </div>
                </div>

                {/* Contact Info Cards */}
                <div className="p-6 space-y-6">
                  {/* Contact Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedContact.phone && (
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{selectedContact.phone}</p>
                            <p className="text-xs text-gray-500">Phone</p>
                          </div>
                        </div>
                      )}
                      {selectedContact.email && (
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{selectedContact.email}</p>
                            <p className="text-xs text-gray-500">Email</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h3>
                    <div className="space-y-3">
                      {activities.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                          No activity yet
                        </div>
                      ) : (
                        activities.map((activity) => (
                          <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-shrink-0 mt-0.5">
                              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">{activity.description}</p>
                              <p className="text-xs text-gray-500 mt-1">{formatDate(activity.created_at)}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No contact selected</h3>
                  <p className="mt-1 text-sm text-gray-500">Select a contact from the list to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}