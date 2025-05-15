import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  MoreHorizontal,
  Edit,
  Trash,
  SlidersHorizontal,
  X,
  Calendar,
  MessageSquare
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';

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

// Mock equipment data
interface Equipment {
  id: string;
  name: string;
  model: string;
  serial: string;
  installed: string;
  last_service: string;
  status: 'active' | 'maintenance' | 'repair_needed' | 'replaced';
}

// Mock service history
interface ServiceHistory {
  id: string;
  date: string;
  type: string;
  description: string;
  technician: string;
  cost: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [contactDetailOpen, setContactDetailOpen] = useState(false);
  
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
  
  // Toggle contact detail when a contact is selected
  useEffect(() => {
    if (selectedContactId) {
      setContactDetailOpen(true);
    }
  }, [selectedContactId]);
  
  // Handle closing the contact detail panel
  const handleContactClose = () => {
    setContactDetailOpen(false);
    // Wait for the slide animation to complete before clearing the selection
    setTimeout(() => setSelectedContactId(null), 300);
  };
  
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
  
  // Get selected contact
  const selectedContact = selectedContactId 
    ? contacts.find(contact => contact.id === selectedContactId) 
    : null;
    
  // Mock equipment data for the selected contact
  const equipmentData: Equipment[] = [
    {
      id: 'e1',
      name: 'Central AC Unit',
      model: 'Carrier Comfort 14',
      serial: 'AC1425367',
      installed: '2020-07-15',
      last_service: '2023-04-10',
      status: 'active'
    },
    {
      id: 'e2',
      name: 'Gas Furnace',
      model: 'Trane XC95m',
      serial: 'TF9523476',
      installed: '2020-07-15',
      last_service: '2023-04-10',
      status: 'maintenance'
    }
  ];
  
  // Mock service history data
  const serviceHistoryData: ServiceHistory[] = [
    {
      id: 's1',
      date: '2023-04-10',
      type: 'Maintenance',
      description: 'Annual maintenance check. Replaced air filter, cleaned coils, checked refrigerant levels.',
      technician: 'Mike Johnson',
      cost: '$149.00'
    },
    {
      id: 's2',
      date: '2022-08-22',
      type: 'Repair',
      description: 'Repaired condensate drain line leak. Replaced damaged section.',
      technician: 'David Miller',
      cost: '$210.00'
    },
    {
      id: 's3',
      date: '2022-05-05',
      type: 'Maintenance',
      description: 'Spring tune-up. Cleaned condenser unit, checked electrical connections.',
      technician: 'Mike Johnson',
      cost: '$129.00'
    }
  ];

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
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
                    <div className="col-span-5 sm:col-span-5">Contact Info</div>
                    <div className="col-span-3 sm:col-span-3">Type</div>
                  </div>
                  
                  {/* Table body */}
                  <div className="divide-y divide-gray-200 bg-white">
                    {contacts.length === 0 ? (
                      <div className="px-6 py-10 text-center text-gray-500">
                        No contacts found matching your search.
                      </div>
                    ) : (
                      contacts.map(contact => (
                        <div
                          key={contact.id}
                          className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedContactId(contact.id)}
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
                          <div className="col-span-5 sm:col-span-5">
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
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Contact Detail Side Panel */}
          {selectedContact && (
            <div className="lg:col-span-5">
              <div className="bg-white border border-gray-200 rounded-md overflow-hidden h-full">
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
                  <div className="px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center text-gray-600">
                        {getInitials(selectedContact.name)}
                      </div>
                      <div className="ml-4">
                        <h2 className="text-lg font-medium text-gray-900">{selectedContact.name}</h2>
                        <p className="text-sm text-gray-500">Customer since {formatDate(selectedContact.customer_since)}</p>
                      </div>
                    </div>
                    <div className="lg:hidden">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="ml-2"
                        onClick={handleContactClose}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 px-6 mb-4">
                    <Button variant="outline" size="sm" className="text-gray-700 h-9">
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                    <Button variant="outline" size="sm" className="text-gray-700 h-9">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                    <Button variant="outline" size="sm" className="text-gray-700 h-9">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                  </div>
                </div>
                
                <Tabs defaultValue="details" className="w-full">
                  <div className="border-b border-gray-200 px-6">
                    <TabsList className="w-full justify-start bg-transparent p-0 border-0">
                      <TabsTrigger 
                        value="details" 
                        className="text-sm data-[state=active]:border-b-2 data-[state=active]:border-gray-900 data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none py-2 px-4"
                      >
                        Contact Details
                      </TabsTrigger>
                      <TabsTrigger 
                        value="equipment" 
                        className="text-sm data-[state=active]:border-b-2 data-[state=active]:border-gray-900 data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none py-2 px-4"
                      >
                        Equipment
                      </TabsTrigger>
                      <TabsTrigger 
                        value="service" 
                        className="text-sm data-[state=active]:border-b-2 data-[state=active]:border-gray-900 data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none py-2 px-4"
                      >
                        Service History
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
                    <TabsContent value="details" className="mt-0 p-0">
                      <div className="space-y-6">
                        {/* Contact Information */}
                        <div>
                          <h3 className="text-base font-medium text-gray-900 mb-4">Contact Information</h3>
                          <div className="space-y-3">
                            <div>
                              <div className="text-sm font-medium text-gray-500">Phone</div>
                              <div className="mt-1 flex items-center">
                                <a href={`tel:${selectedContact.phone}`} className="text-gray-900 hover:text-blue-600">
                                  {selectedContact.phone}
                                </a>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-500">Email</div>
                              <div className="mt-1">
                                <a href={`mailto:${selectedContact.email}`} className="text-gray-900 hover:text-blue-600">
                                  {selectedContact.email}
                                </a>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-500">Address</div>
                              <div className="mt-1">
                                <a 
                                  href={`https://maps.google.com/?q=${encodeURIComponent(selectedContact.address)}`} 
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-900 hover:text-blue-600 flex items-start"
                                >
                                  <MapPin className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0 text-gray-400" />
                                  <span>{selectedContact.address}</span>
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Other details */}
                        <div>
                          <h3 className="text-base font-medium text-gray-900 mb-4">Other Details</h3>
                          <div className="space-y-3">
                            <div>
                              <div className="text-sm font-medium text-gray-500">Type</div>
                              <div className="mt-1">
                                <Badge variant="outline" className="capitalize">
                                  {selectedContact.type}
                                </Badge>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-500">Customer Since</div>
                              <div className="mt-1 text-gray-900">
                                {formatDate(selectedContact.customer_since)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="equipment" className="mt-0 p-0">
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-base font-medium text-gray-900">Equipment</h3>
                          <Button variant="outline" size="sm">
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Add Equipment
                          </Button>
                        </div>
                        
                        {equipmentData.map(equipment => (
                          <div key={equipment.id} className="border rounded-md p-4">
                            <div className="flex justify-between">
                              <h4 className="font-medium text-gray-900">{equipment.name}</h4>
                              <Badge variant="outline" className={
                                equipment.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                                equipment.status === 'maintenance' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                equipment.status === 'repair_needed' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                'bg-gray-50 text-gray-700 border-gray-200'
                              }>
                                {equipment.status === 'repair_needed' ? 'Needs Repair' : 
                                 equipment.status.charAt(0).toUpperCase() + equipment.status.slice(1)}
                              </Badge>
                            </div>
                            
                            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="font-medium text-gray-500">Model</div>
                                <div className="text-gray-900">{equipment.model}</div>
                              </div>
                              <div>
                                <div className="font-medium text-gray-500">Serial</div>
                                <div className="text-gray-900">{equipment.serial}</div>
                              </div>
                              <div>
                                <div className="font-medium text-gray-500">Installed</div>
                                <div className="text-gray-900">{formatDate(equipment.installed)}</div>
                              </div>
                              <div>
                                <div className="font-medium text-gray-500">Last Service</div>
                                <div className="text-gray-900">{formatDate(equipment.last_service)}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="service" className="mt-0 p-0">
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-base font-medium text-gray-900">Service History</h3>
                          <Button variant="outline" size="sm">
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Add Service
                          </Button>
                        </div>
                        
                        {serviceHistoryData.map(service => (
                          <div key={service.id} className="border rounded-md p-4">
                            <div className="flex justify-between mb-2">
                              <h4 className="font-medium text-gray-900">{service.type}</h4>
                              <span className="text-sm text-gray-500">{formatDate(service.date)}</span>
                            </div>
                            
                            <p className="text-sm text-gray-700 mb-3">{service.description}</p>
                            
                            <div className="flex justify-between text-sm">
                              <div className="text-gray-500">
                                Tech: <span className="text-gray-900">{service.technician}</span>
                              </div>
                              <div className="font-medium text-gray-900">{service.cost}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}