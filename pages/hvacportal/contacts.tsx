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
  notes: string;
  lastServiceDate: string | null;
  createdAt: string;
}

export default function ContactsPage() {
  const [businessSlug, setBusinessSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // We no longer need the activeView state since we're removing type filtering
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // State for contacts data from the API
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    async function fetchContacts() {
      try {
        // Get business slug from localStorage
        const storedBusinessSlug = localStorage.getItem('businessSlug');
        setBusinessSlug(storedBusinessSlug);
        
        if (!storedBusinessSlug) {
          setIsLoading(false);
          return;
        }
        
        // Fetch contacts from the API
        const response = await fetch(`/api/contacts?businessSlug=${storedBusinessSlug}`);
        const data = await response.json();
        
        if (data.success && data.contacts) {
          // Transform data to match our Contact interface
          const formattedContacts: Contact[] = data.contacts.map((contact: any) => ({
            id: contact.id,
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            address: contact.address,
            city: contact.city,
            state: contact.state,
            zip: contact.zip,
            notes: contact.notes,
            lastServiceDate: contact.last_service_date,
            createdAt: contact.created_at
          }));
          
          setContacts(formattedContacts);
        } else {
          console.error('Failed to fetch contacts:', data.message);
        }
      } catch (err) {
        console.error('Error fetching contacts:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchContacts();
  }, []);

  // Filter contacts based on search query only
  const filteredContacts = contacts.filter(contact => {
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

        {/* Search */}
        <div className="w-full max-w-md">
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
                      Last Service
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getServiceDate(contact.lastServiceDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            View
                          </button>
                          <button className="text-blue-600 hover:text-blue-900">
                            Edit
                          </button>
                          <button className="text-blue-600 hover:text-blue-900">
                            Message
                          </button>
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