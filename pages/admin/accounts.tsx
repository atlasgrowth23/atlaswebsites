import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import AdminLayout from '@/components/AdminLayout';
import { createClient } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  owner_name: string;
  company_id: string;
  company_name: string;
  logo_url: string;
  created_at: string;
  updated_at: string;
}

interface Company {
  id: string;
  name: string;
  slug: string;
}

interface AccountsPageProps {
  initialUsers: User[];
  companies: Company[];
}

export default function AccountsPage({ initialUsers, companies }: AccountsPageProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [filteredUsers, setFilteredUsers] = useState<User[]>(initialUsers);
  const [companies_list, setCompanies] = useState<Company[]>(companies);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    owner_name: '',
    company_id: ''
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');

      const response = await fetch('/api/admin/get-users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setFilteredUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('auth_token');

      const url = '/api/admin/manage-user';
      const method = editingUser ? 'PUT' : 'POST';
      const body = editingUser 
        ? { ...formData, id: editingUser.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        await fetchUsers();
        setShowCreateModal(false);
        setEditingUser(null);
        setFormData({ email: '', owner_name: '', company_id: '' });
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error saving user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`/api/admin/manage-user?id=${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchUsers();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      owner_name: user.owner_name,
      company_id: user.company_id
    });
    setShowCreateModal(true);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ email: '', owner_name: '', company_id: '' });
    setShowCreateModal(true);
  };

  const openViewModal = (user: User) => {
    setViewingUser(user);
    setShowViewModal(true);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.owner_name.toLowerCase().includes(term.toLowerCase()) ||
        user.email.toLowerCase().includes(term.toLowerCase()) ||
        user.company_name.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  const handleImpersonate = async (user: User) => {
    if (!confirm(`Impersonate ${user.owner_name || user.email}? This will log you in as this user.`)) return;
    
    try {
      const impersonateData = {
        email: user.email,
        name: user.owner_name || 'Business Owner',
        company_id: user.company_id,
        company_name: user.company_name,
        authenticated: true,
        login_time: Date.now(),
        provider: 'admin_impersonate'
      };
      
      sessionStorage.setItem('atlas_user', JSON.stringify(impersonateData));
      window.open('/dashboard', '_blank');
    } catch (error) {
      console.error('Error impersonating user:', error);
      alert('Failed to impersonate user');
    }
  };

  return (
    <AdminLayout currentPage="accounts">
      <Head>
        <title>User Account Management - Atlas Growth Admin</title>
        <meta name="description" content="Manage user accounts for Atlas Growth" />
      </Head>

      <div className="py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">User Account Management</h1>
                <p className="text-gray-600 mt-1">Manage user accounts for Atlas Growth (Nicholas Super Admin Only)</p>
              </div>
              <div className="mt-4 sm:mt-0">
                <button
                  onClick={openCreateModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Add New User
                </button>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, email, or company..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="block w-full pl-4 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
              <div className="text-sm text-gray-500 flex items-center">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-2xl font-bold text-blue-600">{users.length}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-2xl font-bold text-green-600">{companies_list.length}</div>
              <div className="text-sm text-gray-600">Total Companies</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-2xl font-bold text-purple-600">
                {users.filter(u => u.email).length}
              </div>
              <div className="text-sm text-gray-600">Users with Email</div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">User Accounts</h2>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {user.logo_url ? (
                                <img 
                                  className="h-10 w-10 rounded-full object-cover" 
                                  src={user.logo_url} 
                                  alt=""
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-600">
                                    {(user.owner_name || user.email || 'U').charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.owner_name || 'No Name'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email || 'No Email'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.company_name}</div>
                          <div className="text-sm text-gray-500">ID: {user.company_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-1">
                            <button
                              onClick={() => openViewModal(user)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleImpersonate(user)}
                              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                              Login As
                            </button>
                            <button
                              onClick={() => openEditModal(user)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredUsers.length === 0 && users.length > 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-500">No users match your search</div>
                    <button
                      onClick={() => handleSearch('')}
                      className="mt-4 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Clear search
                    </button>
                  </div>
                )}

                {users.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-500">No users found</div>
                    <button
                      onClick={openCreateModal}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium"
                    >
                      Create First User
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* View Account Modal */}
        {showViewModal && viewingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Account Details</h3>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="px-6 py-4">
                <div className="space-y-6">
                  {/* User Profile */}
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {viewingUser.logo_url ? (
                        <img 
                          className="h-16 w-16 rounded-full object-cover border-2 border-gray-200" 
                          src={viewingUser.logo_url} 
                          alt=""
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-xl font-bold text-gray-600">
                            {(viewingUser.owner_name || viewingUser.email || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900">
                        {viewingUser.owner_name || 'No Name'}
                      </h4>
                      <p className="text-gray-600">{viewingUser.email || 'No Email'}</p>
                    </div>
                  </div>

                  {/* Account Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-3">Personal Information</h5>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs text-gray-500">Full Name</span>
                          <div className="text-sm font-medium">{viewingUser.owner_name || 'Not provided'}</div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Email Address</span>
                          <div className="text-sm font-medium">{viewingUser.email || 'Not provided'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-3">Company Information</h5>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs text-gray-500">Company Name</span>
                          <div className="text-sm font-medium">{viewingUser.company_name}</div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Company ID</span>
                          <div className="text-sm font-medium">{viewingUser.company_id}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Activity */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Account Activity</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-gray-500">Account Created</span>
                        <div className="text-sm font-medium">
                          {new Date(viewingUser.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Last Updated</span>
                        <div className="text-sm font-medium">
                          {new Date(viewingUser.updated_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-blue-900 mb-3">Quick Actions</h5>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleImpersonate(viewingUser)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Login as User
                      </button>
                      <button
                        onClick={() => {
                          setShowViewModal(false);
                          openEditModal(viewingUser);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Edit Account
                      </button>
                      <button
                        onClick={() => window.open(`/t/moderntrust/${viewingUser.company_id}`, '_blank')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        View Website
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingUser ? 'Edit User' : 'Create New User'}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Owner Name
                    </label>
                    <input
                      type="text"
                      value={formData.owner_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, owner_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company
                    </label>
                    <select
                      required
                      value={formData.company_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, company_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Company</option>
                      {companies_list.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : (editingUser ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch initial data - authentication will be handled by AdminLayout
    const [usersResponse, companiesResponse] = await Promise.all([
      supabaseAdmin
        .from('tk_contacts')
        .select(`
          id,
          owner_email,
          owner_name,
          company_id,
          created_at,
          updated_at,
          companies (
            id,
            name,
            logo_storage_path
          )
        `)
        .order('created_at', { ascending: false }),
      
      supabaseAdmin
        .from('companies')
        .select('id, name, slug')
        .order('name', { ascending: true })
    ]);

    const initialUsers = usersResponse.data?.map(user => ({
      id: user.id,
      email: user.owner_email || '',
      owner_name: user.owner_name || '',
      company_id: user.company_id,
      company_name: user.companies?.name || 'No Company',
      logo_url: user.companies?.logo_storage_path || '',
      created_at: user.created_at,
      updated_at: user.updated_at
    })) || [];

    const companies = companiesResponse.data || [];

    return {
      props: {
        initialUsers,
        companies,
      },
    };

  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        initialUsers: [],
        companies: [],
      },
    };
  }
};