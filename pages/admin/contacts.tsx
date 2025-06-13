import { useState, useEffect } from 'react';
import UnifiedAdminLayout from '@/components/UnifiedAdminLayout';

interface Contact {
  id: string;
  company_name: string;
  owner_name: string;
  owner_email: string;
  phone?: string;
  city?: string;
  state?: string;
  created_at: string;
  google_contact_created?: boolean;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [creatingGoogleContact, setCreatingGoogleContact] = useState<string | null>(null);
  const [googleStatus, setGoogleStatus] = useState<{ [key: string]: string }>({});
  const [googleConnected, setGoogleConnected] = useState(true); // Always connected with new OAuth

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/contacts');
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
      } else {
        console.error('Failed to fetch contacts');
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };


  const createGoogleContact = async (contact: Contact) => {
    if (!contact.owner_name || !contact.owner_email) {
      setGoogleStatus({ ...googleStatus, [contact.id]: '❌ Missing name or email' });
      return;
    }

    setCreatingGoogleContact(contact.id);
    setGoogleStatus({ ...googleStatus, [contact.id]: '⏳ Creating contact...' });

    try {
      const response = await fetch('/api/google/create-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerName: contact.owner_name,
          ownerEmail: contact.owner_email,
          companyName: contact.company_name,
          phone: contact.phone,
          notes: `Contact from CRM - ${contact.city ? `${contact.city}, ${contact.state}` : 'Location unknown'}`
        })
      });

      const data = await response.json();

      if (response.ok) {
        setGoogleStatus({ ...googleStatus, [contact.id]: '✅ Google contact created!' });
        // Update the contact in our list
        setContacts(contacts.map(c => 
          c.id === contact.id 
            ? { ...c, google_contact_created: true }
            : c
        ));
      } else {
        setGoogleStatus({ ...googleStatus, [contact.id]: `❌ Failed: ${data.error}` });
      }
    } catch (error) {
      console.error('Error creating Google contact:', error);
      setGoogleStatus({ ...googleStatus, [contact.id]: '❌ Error creating contact' });
    } finally {
      setCreatingGoogleContact(null);
      // Clear status after 5 seconds
      setTimeout(() => {
        setGoogleStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[contact.id];
          return newStatus;
        });
      }, 5000);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.owner_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <UnifiedAdminLayout currentPage="contacts">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📞 Contacts</h1>
              <p className="mt-2 text-gray-600">
                Manage your business contacts and sync with Google Contacts
              </p>
            </div>
            
            {/* Google Connection Status */}
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                <span className="text-sm font-medium">
                  Google: Connected
                </span>
              </div>
            </div>
          </div>
          
          {/* System Status Messages */}
          {googleStatus.system && (
            <div className={`mt-4 px-4 py-2 rounded-lg text-sm ${
              googleStatus.system.includes('✅') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {googleStatus.system}
            </div>
          )}
        </div>

        {/* Search and Stats */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-green-100 border border-green-300 rounded-full"></span>
                <span>Total Contacts: {contacts.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-blue-100 border border-blue-300 rounded-full"></span>
                <span>Google Synced: {contacts.filter(c => c.google_contact_created).length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contacts List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading contacts...</p>
            </div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search terms.' : 'Contacts will appear here when you save owner name + email in the pipeline.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {filteredContacts.length} Contact{filteredContacts.length !== 1 ? 's' : ''}
                {searchTerm && ` matching "${searchTerm}"`}
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Google
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredContacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{contact.owner_name}</div>
                          <div className="text-sm text-gray-500">{contact.owner_email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{contact.company_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {contact.city && contact.state ? `${contact.city}, ${contact.state}` : 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {contact.phone ? (
                            <a href={`tel:${contact.phone}`} className="text-blue-600 hover:text-blue-800">
                              {contact.phone}
                            </a>
                          ) : (
                            <span className="text-gray-400">No phone</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {contact.google_contact_created ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✅ Synced
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              ⚪ Not synced
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {!contact.google_contact_created && (
                            <button
                              onClick={() => createGoogleContact(contact)}
                              disabled={creatingGoogleContact === contact.id}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                            >
                              {creatingGoogleContact === contact.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1"></div>
                                  Creating...
                                </>
                              ) : (
                                <>
                                  📱 Create Google Contact
                                </>
                              )}
                            </button>
                          )}
                          
                          <a
                            href={`mailto:${contact.owner_email}`}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                          >
                            ✉️ Email
                          </a>
                        </div>
                        
                        {googleStatus[contact.id] && (
                          <div className={`mt-2 text-xs ${
                            googleStatus[contact.id].includes('✅') ? 'text-green-600' : 
                            googleStatus[contact.id].includes('❌') ? 'text-red-600' : 'text-blue-600'
                          }`}>
                            {googleStatus[contact.id]}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </UnifiedAdminLayout>
  );
}