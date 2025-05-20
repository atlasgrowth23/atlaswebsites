import { useState, useEffect } from 'react';
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
  rating: number;
  reviews: number;
}

export default function AdminDashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    fetchCompanies();
  }, []);
  
  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredCompanies = companies.filter(company => {
    // Apply status filter
    if (statusFilter !== 'all' && company.status !== statusFilter) {
      return false;
    }
    
    // Apply search filter
    if (searchTerm && !company.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !company.city.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  const pipelineStats = {
    new: companies.filter(c => c.status === 'new').length,
    contacted: companies.filter(c => c.status === 'contacted').length,
    siteSent: companies.filter(c => c.status === 'site_sent').length,
    viewed: companies.filter(c => c.status === 'viewed').length,
    followUp: companies.filter(c => c.status === 'follow_up').length,
    converted: companies.filter(c => c.status === 'converted').length,
    lost: companies.filter(c => c.status === 'lost').length
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  return (
    <>
      <Head>
        <title>HVAC Prospect Management</title>
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
          <h1 className="text-3xl font-bold mb-6">Prospect Dashboard</h1>
          
          {/* Pipeline Stats */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-bold text-xl">Pipeline Overview</h2>
            </div>
            <div className="p-4 grid grid-cols-7 gap-4 text-center">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-3xl font-bold text-blue-600">{pipelineStats.new}</div>
                <div className="text-sm text-gray-600">New</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-3xl font-bold text-indigo-600">{pipelineStats.contacted}</div>
                <div className="text-sm text-gray-600">Contacted</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-3xl font-bold text-purple-600">{pipelineStats.siteSent}</div>
                <div className="text-sm text-gray-600">Site Sent</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-3xl font-bold text-green-600">{pipelineStats.viewed}</div>
                <div className="text-sm text-gray-600">Viewed</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-3xl font-bold text-yellow-600">{pipelineStats.followUp}</div>
                <div className="text-sm text-gray-600">Follow-Up</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-3xl font-bold text-green-700">{pipelineStats.converted}</div>
                <div className="text-sm text-gray-600">Converted</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-3xl font-bold text-red-600">{pipelineStats.lost}</div>
                <div className="text-sm text-gray-600">Lost</div>
              </div>
            </div>
          </div>
          
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-bold text-xl">Recent Site Views</h2>
              <Link href="/admin/activity" className="text-blue-600 hover:underline text-sm">
                View All Activity
              </Link>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="text-center p-4">Loading recent activity...</div>
              ) : companies.filter(c => c.last_viewed).length > 0 ? (
                <div className="space-y-3">
                  {companies
                    .filter(c => c.last_viewed)
                    .sort((a, b) => new Date(b.last_viewed).getTime() - new Date(a.last_viewed).getTime())
                    .slice(0, 5)
                    .map(company => (
                      <div key={company.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{company.name}</div>
                          <div className="text-sm text-gray-600">{company.city}, {company.state}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Last viewed</div>
                          <div>{formatDate(company.last_viewed)}</div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center p-4 text-gray-500">No recent site views</div>
              )}
            </div>
          </div>
          
          {/* Companies Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-bold text-xl">All Prospects</h2>
              <div className="flex space-x-4">
                <div>
                  <input
                    type="text"
                    placeholder="Search companies..."
                    className="px-3 py-2 border rounded"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <select 
                    className="px-3 py-2 border rounded"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="site_sent">Site Sent</option>
                    <option value="viewed">Viewed</option>
                    <option value="follow_up">Follow-Up</option>
                    <option value="converted">Converted</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={fetchCompanies}
                >
                  Refresh
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Contact</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Viewed</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4">Loading companies...</td>
                    </tr>
                  ) : filteredCompanies.length > 0 ? (
                    filteredCompanies.map(company => (
                      <tr key={company.id}>
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{company.name}</div>
                          <div className="text-sm text-gray-500">{company.phone}</div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">{company.city}, {company.state}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            company.status === 'new' ? 'bg-blue-100 text-blue-800' :
                            company.status === 'contacted' ? 'bg-indigo-100 text-indigo-800' :
                            company.status === 'site_sent' ? 'bg-purple-100 text-purple-800' :
                            company.status === 'viewed' ? 'bg-green-100 text-green-800' :
                            company.status === 'follow_up' ? 'bg-yellow-100 text-yellow-800' :
                            company.status === 'converted' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {company.status === 'site_sent' ? 'Site Sent' : 
                            company.status === 'follow_up' ? 'Follow-Up' : 
                            company.status.charAt(0).toUpperCase() + company.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">{formatDate(company.last_contact)}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">{formatDate(company.last_viewed)}</td>
                        <td className="py-3 px-4 space-x-2">
                          <Link href={`/admin/companies/${company.id}`} className="text-indigo-600 hover:text-indigo-900">
                            View
                          </Link>
                          <Link href={`/t/moderntrust/${company.slug}`} target="_blank" className="text-green-600 hover:text-green-900">
                            Preview
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-gray-500">No companies found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}