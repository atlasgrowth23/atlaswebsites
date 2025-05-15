import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  Plus,
  Search,
  Phone,
  Mail,
  MoreHorizontal,
  Edit,
  Trash,
  SlidersHorizontal
} from 'lucide-react';
import MainLayout from '@/components/dashboard/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Types definition
interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  customer_since: string;
  type: 'residential' | 'commercial';
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Load mock data
  useEffect(() => {
    setTimeout(() => {
      const mockContacts: Contact[] = [
        {
          id: '1',
          name: 'John Smith',
          phone: '(555) 123-4567',
          email: 'john.smith@example.com',
          address: '123 Main St, Anytown, CA 95012',
          customer_since: '2020-03-15',
          type: 'residential'
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          phone: '(555) 987-6543',
          email: 'sarah.j@example.com',
          address: '456 Oak Ave, Springfield, IL 62701',
          customer_since: '2021-07-22',
          type: 'residential'
        },
        {
          id: '3',
          name: 'David Wilson',
          phone: '(555) 456-7890',
          email: 'dwilson@example.com',
          address: '789 Pine St, Lakeside, MI 49456',
          customer_since: '2018-05-30',
          type: 'residential'
        },
        {
          id: '4',
          name: 'Jennifer Garcia',
          phone: '(555) 234-5678',
          email: 'jgarcia@example.com',
          address: '321 Maple Rd, Riverside, CA 92501',
          customer_since: '2022-01-15',
          type: 'residential'
        },
        {
          id: '5',
          name: 'Oakridge Office Complex',
          phone: '(555) 876-5432',
          email: 'manager@oakridgeoffices.com',
          address: '555 Cedar Ln, Oakville, TX 78570',
          customer_since: '2019-11-03',
          type: 'commercial'
        }
      ];
      
      setContacts(mockContacts);
      setLoading(false);
    }, 800);
  }, []);
  
  // Format date function
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <MainLayout title="Contacts">
      <Head>
        <title>Contacts - HVAC Pro</title>
        <meta name="description" content="Manage customer contacts" />
      </Head>
      
      <div>
        {/* Page header */}
        <div className="border-b border-gray-200 pb-5 mb-5 flex flex-wrap items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your customer contacts
            </p>
          </div>
          <div className="mt-3 sm:mt-0 flex space-x-3">
            <Button 
              variant="outline"
              className="text-gray-700 border-gray-300 h-9"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button className="bg-gray-900 hover:bg-gray-800 h-9">
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="mb-5 flex">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search customers..." 
              className="pl-9 w-full h-9 border-gray-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Main content */}
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-4 sm:col-span-4">Customer</div>
                <div className="col-span-4 sm:col-span-4">Contact</div>
                <div className="col-span-3 sm:col-span-3">Type</div>
                <div className="col-span-1 sm:col-span-1 text-right">Actions</div>
              </div>
              
              {/* Table body */}
              <div className="divide-y divide-gray-200 bg-white">
                {contacts.length === 0 ? (
                  <div className="px-6 py-10 text-center text-gray-500">
                    No customers found matching your search.
                  </div>
                ) : (
                  contacts.map(contact => (
                    <div
                      key={contact.id}
                      className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="col-span-4 sm:col-span-4 flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded bg-gray-200 flex items-center justify-center text-gray-600">
                          {getInitials(contact.name)}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{contact.name}</div>
                          <div className="text-sm text-gray-500">Since {formatDate(contact.customer_since)}</div>
                        </div>
                      </div>
                      <div className="col-span-4 sm:col-span-4">
                        <div className="flex items-center text-sm text-gray-700">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {contact.phone}
                        </div>
                        <div className="flex items-center text-sm text-gray-700 mt-1">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {contact.email}
                        </div>
                      </div>
                      <div className="col-span-3 sm:col-span-3 flex items-center">
                        <Badge variant="outline" className="capitalize">
                          {contact.type}
                        </Badge>
                      </div>
                      <div className="col-span-1 sm:col-span-1 flex justify-end items-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}