import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Plus,
  Search,
  SlidersHorizontal,
  Phone,
  Mail,
  MoreHorizontal,
  Edit,
  Trash,
  X
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function ContactsPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  
  // Refs for the contact form
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const typeRef = useRef<HTMLSelectElement>(null);
  
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
  
  // Handle adding a new contact
  const handleAddContact = () => {
    if (!nameRef.current?.value) return;
    
    const newContact: Contact = {
      id: (contacts.length + 1).toString(),
      name: nameRef.current.value,
      phone: phoneRef.current?.value || '',
      email: emailRef.current?.value || '',
      address: addressRef.current?.value || '',
      customer_since: new Date().toISOString().split('T')[0],
      type: (typeRef.current?.value as 'residential' | 'commercial') || 'residential'
    };
    
    setContacts([...contacts, newContact]);
    setShowAddContact(false);
  };
  
  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      contact.name.toLowerCase().includes(searchLower) ||
      contact.email.toLowerCase().includes(searchLower) ||
      contact.phone.includes(searchTerm) ||
      contact.address.toLowerCase().includes(searchLower) ||
      contact.type.toLowerCase().includes(searchLower)
    );
  });
  
  // Format date helper function
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
  
  // Navigate to contact detail page
  const handleSelectContact = (id: string) => {
    router.push(`/dashboard/${slug}/contacts/${id}`);
  };
  
  // Handle contact deletion
  const handleDeleteContact = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setContacts(contacts.filter(contact => contact.id !== id));
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
              className="bg-blue-600 hover:bg-blue-700 h-9 text-white"
              onClick={() => setShowAddContact(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>
        
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
                        <Badge variant="outline" className={
                          contact.type === 'residential' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                          'bg-green-50 text-green-700 border-green-200'
                        }>
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
                              onClick={(e) => handleDeleteContact(contact.id, e)}
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
      
      {/* Add Contact Dialog */}
      <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription>
              Enter the details of the new contact below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                ref={nameRef}
                placeholder="Full name"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                ref={phoneRef}
                placeholder="(555) 123-4567"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                ref={emailRef}
                placeholder="email@example.com"
                className="col-span-3"
                type="email"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Address
              </Label>
              <Input
                id="address"
                ref={addressRef}
                placeholder="123 Main St, City, State Zip"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <select
                id="type"
                ref={typeRef}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                defaultValue="residential"
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAddContact(false)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleAddContact}
            >
              Add Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}