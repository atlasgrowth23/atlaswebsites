import React, { useEffect, useState } from 'react';
import PortalLayout from '@/components/portal/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  type: 'residential' | 'commercial';
  notes: string;
  lastServiceDate: string | null;
  equipmentCount: number;
  createdAt: string;
}

export default function ContactsPage() {
  const [businessSlug, setBusinessSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Sample contacts data - would come from an API in production
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: 1,
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '(555) 123-4567',
      address: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      zip: '62701',
      type: 'residential',
      notes: 'Prefers afternoon appointments',
      lastServiceDate: '2025-04-15',
      equipmentCount: 2,
      createdAt: '2024-12-10'
    },
    {
      id: 2,
      name: 'Springfield Elementary School',
      email: 'facilities@springfieldelementary.edu',
      phone: '(555) 987-6543',
      address: '456 School Ave',
      city: 'Springfield',
      state: 'IL',
      zip: '62702',
      type: 'commercial',
      notes: 'Regular maintenance contract. Contact Principal Skinner.',
      lastServiceDate: '2025-05-01',
      equipmentCount: 8,
      createdAt: '2024-08-22'
    },
    {
      id: 3,
      name: 'Sarah Williams',
      email: 'sarah.williams@example.com',
      phone: '(555) 555-5555',
      address: '789 Oak Dr',
      city: 'Springfield',
      state: 'IL',
      zip: '62704',
      type: 'residential',
      notes: 'Has dogs in backyard, call before arriving',
      lastServiceDate: '2025-03-20',
      equipmentCount: 1,
      createdAt: '2025-01-15'
    },
    {
      id: 4,
      name: 'Springfield Mall',
      email: 'maintenance@springfieldmall.com',
      phone: '(555) 333-2222',
      address: '100 Shopping Center Blvd',
      city: 'Springfield',
      state: 'IL',
      zip: '62701',
      type: 'commercial',
      notes: 'Annual contract, requires 24hr notice for service visits',
      lastServiceDate: '2025-04-30',
      equipmentCount: 15,
      createdAt: '2024-07-19'
    },
    {
      id: 5,
      name: 'Michael Brown',
      email: 'michael.brown@example.com',
      phone: '(555) 777-8888',
      address: '321 Pine Ave',
      city: 'Springfield',
      state: 'IL',
      zip: '62703',
      type: 'residential',
      notes: 'New customer, referred by John Smith',
      lastServiceDate: null,
      equipmentCount: 2,
      createdAt: '2025-05-05'
    }
  ]);

  useEffect(() => {
    // In production, this would fetch actual data from an API
    const storedBusinessSlug = localStorage.getItem('businessSlug');
    setBusinessSlug(storedBusinessSlug);
    
    // Simulate API call delay
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  }, []);

  // Filter contacts based on active view and search query
  const filteredContacts = contacts.filter(contact => {
    // First filter by view
    if (activeView !== 'all' && contact.type !== activeView) return false;
    
    // Then filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        contact.name.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query) ||
        contact.phone.includes(query) ||
        contact.address.toLowerCase().includes(query) ||
        contact.city.toLowerCase().includes(query) ||
        contact.notes.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Get formatted last service date or display "No service history"
  const getServiceDate = (dateString: string | null) => {
    if (!dateString) return "No service history";
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Get the business slug in the correct format for the PortalLayout
  const businessSlugProp = businessSlug === null ? undefined : businessSlug;

  return (
    <PortalLayout businessSlug={businessSlugProp}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Contact Management</h1>
            <p className="text-gray-500">Manage your customers and their service history</p>
          </div>
          <div>
            <Button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
              + Add New Contact
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-md">
            <button 
              onClick={() => setActiveView('all')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${activeView === 'all' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              All Contacts
            </button>
            <button 
              onClick={() => setActiveView('residential')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${activeView === 'residential' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Residential
            </button>
            <button 
              onClick={() => setActiveView('commercial')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${activeView === 'commercial' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Commercial
            </button>
          </div>
          <div>
            <div className="relative">
              <input
                type="text"
                className="w-full border rounded-md py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search contacts by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Contacts List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <Card className="border border-dashed">
              <CardContent className="py-12">
                <div className="text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium">No contacts found</h3>
                  <p className="mt-2 text-gray-500">Try adjusting your filters or search query.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Service
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equipment
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredContacts.map(contact => (
                    <tr key={contact.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {contact.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                            <div className="text-sm text-gray-500">Customer #{contact.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{contact.email}</div>
                        <div className="text-sm text-gray-500">{contact.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{contact.address}</div>
                        <div className="text-sm text-gray-500">{`${contact.city}, ${contact.state} ${contact.zip}`}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          contact.type === 'residential' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {contact.type.charAt(0).toUpperCase() + contact.type.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getServiceDate(contact.lastServiceDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {contact.equipmentCount} {contact.equipmentCount === 1 ? 'unit' : 'units'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            View
                          </button>
                          <button className="text-blue-600 hover:text-blue-900">
                            Edit
                          </button>
                          <Link href="/hvacportal/jobs">
                            <button className="text-blue-600 hover:text-blue-900">
                              New Job
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}