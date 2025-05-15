import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import {
  Plus,
  Search,
  SlidersHorizontal,
  Phone,
  Mail,
  MoreHorizontal,
  Edit,
  Trash,
  MapPin
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
import { Contact } from '@/types/contact';
import { AddContactDialog } from '@/components/dashboard/contacts/AddContactDialog';

export default function ContactsPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [company, setCompany] = useState<{ id: string; name: string } | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch company information and contacts
  useEffect(() => {
    if (!slug) {
      // If we don't have a slug yet, wait for it to be available
      return;
    }
    
    const fetchCompanyAndContacts = async () => {
      try {
        setLoading(true);
        
        // First, get the company ID from the slug
        const companyResponse = await axios.get(`/api/companies/by-slug?slug=${slug}`);
        const companyData = companyResponse.data;
        setCompany(companyData);
        
        // Then, fetch the contacts for this company
        const contactsResponse = await axios.get(`/api/contacts?company_id=${companyData.id}`);
        setContacts(contactsResponse.data);
      } catch (error) {
        console.error('Error fetching company contacts:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompanyAndContacts();
  }, [slug]);
  
  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      contact.name.toLowerCase().includes(searchLower) ||
      (contact.email && contact.email.toLowerCase().includes(searchLower)) ||
      (contact.phone && contact.phone.includes(searchTerm)) ||
      (contact.street && contact.street.toLowerCase().includes(searchLower)) ||
      (contact.city && contact.city.toLowerCase().includes(searchLower)) ||
      (contact.type && contact.type.toLowerCase().includes(searchLower))
    );
  });
  
  // Format date helper function
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Get initials for avatar
  const getInitials = (name: string | undefined) => {
    if (!name) return 'NA';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  
  // Navigate to contact detail page
  const handleSelectContact = (id: string) => {
    router.push(`/dashboard/contacts/${id}`);
  };
  
  // Add Contact functionality
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  
  const handleAddContact = () => {
    if (!company) {
      console.error('No company selected');
      return;
    }
    setIsAddContactOpen(true);
  };
  
  const handleContactAdded = (newContact: Contact) => {
    setContacts(prev => [...prev, newContact]);
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
            <h1 className="text-2xl font-semibold text-gray-900">Contacts</h1>
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
            <Button 
              className="bg-gray-900 hover:bg-gray-800 h-9 text-white"
              onClick={handleAddContact}
              disabled={!company}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>
        
        {/* Add Contact Dialog */}
        {company && (
          <AddContactDialog
            isOpen={isAddContactOpen}
            onClose={() => setIsAddContactOpen(false)}
            companyId={company.id}
            onContactAdded={handleContactAdded}
          />
        )}
        
        {/* Search */}
        <div className="mb-5 flex">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search contacts..." 
              className="pl-9 w-full h-9 border-gray-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Contacts table */}
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-4 sm:col-span-4">Contact</div>
                <div className="col-span-4 sm:col-span-4">Contact Info</div>
                <div className="col-span-3 sm:col-span-3">Type</div>
                <div className="col-span-1 sm:col-span-1 text-right">Actions</div>
              </div>
              
              {/* Table body */}
              <div className="divide-y divide-gray-200 bg-white">
                {filteredContacts.length === 0 ? (
                  <div className="px-6 py-10 text-center text-gray-500">
                    No contacts found matching your search.
                  </div>
                ) : (
                  filteredContacts.map(contact => (
                    <div
                      key={contact.id}
                      className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleSelectContact(contact.id)}
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
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleSelectContact(contact.id);
                            }}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={(e) => e.stopPropagation()}
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