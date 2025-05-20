import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

interface Company {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  status: string;
  last_contact: string;
  last_viewed: string;
  notes: string;
  created_at: string;
  rating: number;
  reviews: number;
}

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'site_sent', label: 'Site Sent' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'follow_up', label: 'Follow-Up' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost', label: 'Lost' }
];

export default function CompanyDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    notes: '',
    last_contact: ''
  });
  const [messages, setMessages] = useState([]);
  
  useEffect(() => {
    if (id) {
      fetchCompany();
      fetchMessages();
    }
  }, [id]);
  
  const fetchCompany = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/companies/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCompany(data);
        setFormData({
          status: data.status || 'new',
          notes: data.notes || '',
          last_contact: data.last_contact ? new Date(data.last_contact).toISOString().split('T')[0] : ''
        });
      }
    } catch (error) {
      console.error('Error fetching company:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMessages = async () => {
    try {
      if (company?.slug) {
        const response = await fetch(`/api/messages/${company.slug}`);
        if (response.ok) {
          const data = await response.json();
          if (data.sessions) {
            setMessages(data.sessions);
          } else {
            // Handle old format
            setMessages(data);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await fetch(`/api/admin/companies/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        // Refresh company data
        fetchCompany();
      }
    } catch (error) {
      console.error('Error updating company:', error);
    } finally {
      setSaving(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading company data...</div>
      </div>
    );
  }
  
  if (!company) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-red-600">Company not found</div>
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>{company.name} - HVAC Prospect Management</title>
      </Head>
      
      <div className="bg-gray-100 min-h-screen">
        <nav className="bg-blue-800 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <div className="font-bold text-xl">HVAC Template Management</div>
            <div className="space-x-4">
              <Link href="/admin" className="hover:underline">Dashboard</Link>
              <Link href="/admin/companies" className="hover:underline">Companies</Link>
              <Link href="/admin/templates" className="hover:underline">Templates</Link>
              <Link href="/" className="hover:underline">Back to Front</Link>
            </div>
          </div>
        </nav>
        
        <div className="container mx-auto p-6">
          <div className="flex items-center mb-6">
            <Link href="/admin" className="text-blue-600 hover:underline mr-2">
              Dashboard
            </Link>
            <span className="mx-2">›</span>
            <h1 className="text-2xl font-bold">{company.name}</h1>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Company Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Company Information</h2>
              
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">Name</div>
                  <div className="font-medium">{company.name}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">Location</div>
                  <div>{company.city}, {company.state}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">Phone</div>
                  <div>{company.phone || '—'}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div>{company.email || '—'}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">Rating</div>
                  <div>{company.rating} stars ({company.reviews} reviews)</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">Created</div>
                  <div>{formatDate(company.created_at)}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">Last Portal View</div>
                  <div>{formatDate(company.last_viewed)}</div>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                <Link href={`/t/moderntrust/${company.slug}`} className="bg-green-600 text-white px-4 py-2 rounded block text-center hover:bg-green-700" target="_blank">
                  View Template Site
                </Link>
                
                <Link href={`/p/${company.slug}`} className="bg-blue-600 text-white px-4 py-2 rounded block text-center hover:bg-blue-700" target="_blank">
                  View Portal
                </Link>
              </div>
            </div>
            
            {/* Status & Notes */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Status & Notes</h2>
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Contact Date
                    </label>
                    <input
                      type="date"
                      name="last_contact"
                      value={formData.last_contact}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={5}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Add notes about this prospect..."
                    ></textarea>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
              
              {/* Recent Messages */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Recent Messages</h2>
                
                {Array.isArray(messages) && messages.length > 0 ? (
                  <div className="space-y-4">
                    {/* Handle both formats of messages */}
                    {messages.sessions ? (
                      // New format with sessions
                      messages.sessions.slice(0, 5).map(session => (
                        <div key={session.session_id} className="border-b pb-4">
                          <div className="flex justify-between mb-2">
                            <div className="font-medium">{session.contact?.name || 'Website Visitor'}</div>
                            <div className="text-sm text-gray-500">{formatDate(session.last_message_time)}</div>
                          </div>
                          <div className="text-gray-600">{session.last_message}</div>
                        </div>
                      ))
                    ) : (
                      // Original message format
                      messages.slice(0, 5).map(message => (
                        <div key={message.id} className="border-b pb-4">
                          <div className="flex justify-between mb-2">
                            <div className="font-medium">{message.contact_name || 'Website Visitor'}</div>
                            <div className="text-sm text-gray-500">{formatDate(message.ts)}</div>
                          </div>
                          <div className="text-gray-600">{message.message}</div>
                        </div>
                      ))
                    )}
                    
                    <div className="pt-2">
                      <Link href={`/admin/messages/${company.slug}`} className="text-blue-600 hover:underline">
                        View All Messages
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-4">No messages available</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}