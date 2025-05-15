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
  Wrench,
  MessageSquare,
  Calendar,
  Filter,
  ChevronRight,
  CalendarClock
} from 'lucide-react';
import MainLayout from '@/components/dashboard/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Types definition
interface Equipment {
  id: string;
  type: string;
  brand: string;
  model: string;
  install_year: number;
  serial: string;
  last_service?: string;
  warranty_end?: string;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  notes: string;
  customer_since: string;
  equipment: Equipment[];
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Load mock data
  useEffect(() => {
    setTimeout(() => {
      // This would be an API call in a real application
      const mockContacts: Contact[] = [
        {
          id: '1',
          name: 'John Smith',
          phone: '(555) 123-4567',
          email: 'john.smith@example.com',
          street: '123 Main St',
          city: 'Anytown, CA 95012',
          notes: 'Prefers afternoon appointments. Has a large dog in the backyard.',
          customer_since: '2020-03-15',
          equipment: [
            {
              id: '101',
              type: 'Air Conditioner',
              brand: 'Carrier',
              model: 'Infinity 26',
              install_year: 2020,
              serial: 'CA12345678',
              last_service: '2023-04-15',
              warranty_end: '2025-03-15'
            },
            {
              id: '102',
              type: 'Furnace',
              brand: 'Trane',
              model: 'XC95m',
              install_year: 2019,
              serial: 'TR98765432',
              last_service: '2023-09-10',
              warranty_end: '2029-09-10'
            }
          ]
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          phone: '(555) 987-6543',
          email: 'sarah.j@example.com',
          street: '456 Oak Ave',
          city: 'Springfield, IL 62701',
          notes: 'Has a maintenance contract. Front door code: 1234#',
          customer_since: '2021-07-22',
          equipment: [
            {
              id: '201',
              type: 'Heat Pump',
              brand: 'Lennox',
              model: 'XP25',
              install_year: 2021,
              serial: 'LX87654321',
              last_service: '2023-11-05',
              warranty_end: '2031-07-22'
            }
          ]
        },
        {
          id: '3',
          name: 'David Wilson',
          phone: '(555) 456-7890',
          email: 'dwilson@example.com',
          street: '789 Pine St',
          city: 'Lakeside, MI 49456',
          notes: 'Recent water damage in basement.',
          customer_since: '2018-05-30',
          equipment: [
            {
              id: '301',
              type: 'Furnace',
              brand: 'Rheem',
              model: 'R96V',
              install_year: 2018,
              serial: 'RH56781234',
              last_service: '2023-10-15',
              warranty_end: '2028-05-30'
            },
            {
              id: '302',
              type: 'Thermostat',
              brand: 'Nest',
              model: 'Learning Thermostat (3rd Gen)',
              install_year: 2020,
              serial: 'NT44556677',
              last_service: '2023-10-15',
              warranty_end: '2025-10-15'
            }
          ]
        },
        {
          id: '4',
          name: 'Jennifer Garcia',
          phone: '(555) 234-5678',
          email: 'jgarcia@example.com',
          street: '321 Maple Rd',
          city: 'Riverside, CA 92501',
          notes: 'Spanish speaker. Prefers text message communication.',
          customer_since: '2022-01-15',
          equipment: [
            {
              id: '401',
              type: 'Air Conditioner',
              brand: 'Goodman',
              model: 'GSX16',
              install_year: 2022,
              serial: 'GM12345678',
              last_service: '2023-05-20',
              warranty_end: '2032-01-15'
            }
          ]
        },
        {
          id: '5',
          name: 'Michael Taylor',
          phone: '(555) 876-5432',
          email: 'mtaylor@example.com',
          street: '555 Cedar Ln',
          city: 'Oakville, TX 78570',
          notes: 'Works from home. Available all day for service calls.',
          customer_since: '2019-11-03',
          equipment: [
            {
              id: '501',
              type: 'Furnace',
              brand: 'American Standard',
              model: 'S9V2',
              install_year: 2019,
              serial: 'AS87654321',
              last_service: '2023-08-28',
              warranty_end: '2029-11-03'
            },
            {
              id: '502',
              type: 'Air Conditioner',
              brand: 'American Standard',
              model: 'Silver 16',
              install_year: 2019,
              serial: 'AS12345678',
              last_service: '2023-08-28',
              warranty_end: '2029-11-03'
            }
          ]
        }
      ];
      
      setContacts(mockContacts);
      setSelectedContact(mockContacts[0]);
      setLoading(false);
    }, 800);
  }, []);
  
  // Filter contacts by search term and status
  const filteredContacts = contacts.filter(contact => {
    // Search filter
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm);
    
    // Status filter
    if (filterStatus === 'all') {
      return matchesSearch;
    } else if (filterStatus === 'equipment') {
      return matchesSearch && contact.equipment.length > 0;
    } else if (filterStatus === 'no-equipment') {
      return matchesSearch && contact.equipment.length === 0;
    }
    
    return matchesSearch;
  });
  
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

  // Status for equipment (based on last service date)
  const getEquipmentStatus = (equipment: Equipment) => {
    if (!equipment.last_service) return 'unknown';
    
    const lastService = new Date(equipment.last_service);
    const today = new Date();
    const monthsSinceService = (today.getFullYear() - lastService.getFullYear()) * 12 + 
                              today.getMonth() - lastService.getMonth();
    
    if (monthsSinceService > 12) {
      return 'overdue';
    } else if (monthsSinceService > 10) {
      return 'due-soon';
    } else {
      return 'good';
    }
  };
  
  return (
    <MainLayout title="Contacts & Equipment">
      <Head>
        <title>Contacts & Equipment - HVAC Pro</title>
        <meta name="description" content="Manage your customer contacts and equipment" />
      </Head>
      
      <div className="flex flex-col space-y-6 lg:flex-row lg:space-y-0 lg:space-x-6 h-[calc(100vh-140px)]">
        {/* Left sidebar with contact list */}
        <div className="w-full lg:w-1/3 flex flex-col bg-white rounded-md shadow overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-lg">Customers</h2>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add Contact
              </Button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search contacts..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex space-x-2 mt-3">
              <Button 
                variant={filterStatus === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                All
              </Button>
              <Button 
                variant={filterStatus === 'equipment' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilterStatus('equipment')}
              >
                Has Equipment
              </Button>
              <Button 
                variant={filterStatus === 'no-equipment' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilterStatus('no-equipment')}
              >
                No Equipment
              </Button>
            </div>
          </div>
          
          <div className="flex-grow overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No contacts found</p>
              </div>
            ) : (
              <ul className="divide-y">
                {filteredContacts.map(contact => (
                  <li key={contact.id}>
                    <button
                      className={cn(
                        "w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none transition-colors",
                        selectedContact?.id === contact.id && "bg-blue-50"
                      )}
                      onClick={() => setSelectedContact(contact)}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                            {getInitials(contact.name)}
                          </div>
                        </div>
                        <div className="ml-3 flex-grow">
                          <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                          <p className="text-xs text-gray-500">{contact.phone}</p>
                        </div>
                        {contact.equipment.length > 0 && (
                          <Badge variant="outline" className="ml-auto">
                            {contact.equipment.length} items
                          </Badge>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {/* Right main content area */}
        <div className="w-full lg:w-2/3 bg-white rounded-md shadow overflow-hidden">
          {!selectedContact ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-6">
                <p className="text-lg font-medium">No contact selected</p>
                <p className="text-gray-500">Select a contact from the list to view details</p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Contact header */}
              <div className="p-6 border-b">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-lg">
                      {getInitials(selectedContact.name)}
                    </div>
                    <div className="ml-4">
                      <h2 className="text-2xl font-semibold">{selectedContact.name}</h2>
                      <p className="text-gray-500">Customer since {formatDate(selectedContact.customer_since)}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-1" /> Message
                    </Button>
                    <Button variant="outline" size="sm">
                      <Calendar className="h-4 w-4 mr-1" /> Schedule
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" /> Edit Contact
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Wrench className="h-4 w-4 mr-2" /> Add Equipment
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash className="h-4 w-4 mr-2" /> Delete Contact
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
              
              {/* Contact details and equipment */}
              <div className="flex-1 overflow-y-auto">
                <Tabs defaultValue="details" className="w-full h-full">
                  <div className="border-b px-6">
                    <TabsList className="w-full justify-start border-0 p-0 mb-0">
                      <TabsTrigger 
                        value="details" 
                        className="data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent rounded-none pb-3"
                      >
                        Contact Details
                      </TabsTrigger>
                      <TabsTrigger 
                        value="equipment" 
                        className="data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent rounded-none pb-3"
                      >
                        Equipment ({selectedContact.equipment.length})
                      </TabsTrigger>
                      <TabsTrigger 
                        value="history" 
                        className="data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent rounded-none pb-3"
                      >
                        Service History
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <div className="p-6">
                    <TabsContent value="details" className="m-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Contact Info */}
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
                          <div className="space-y-4">
                            <div className="flex items-start">
                              <Phone className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                              <div>
                                <a href={`tel:${selectedContact.phone}`} className="text-blue-600 hover:underline">
                                  {selectedContact.phone}
                                </a>
                                <p className="text-xs text-gray-500">Primary Phone</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start">
                              <Mail className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                              <div>
                                <a href={`mailto:${selectedContact.email}`} className="text-blue-600 hover:underline">
                                  {selectedContact.email}
                                </a>
                                <p className="text-xs text-gray-500">Email Address</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start">
                              <MapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                              <div>
                                <p className="text-gray-900">{selectedContact.street}</p>
                                <p className="text-gray-900">{selectedContact.city}</p>
                                <a 
                                  href={`https://maps.google.com/?q=${encodeURIComponent(
                                    `${selectedContact.street}, ${selectedContact.city}`
                                  )}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  View on map
                                </a>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-8">
                            <div className="flex justify-between items-center mb-3">
                              <h3 className="font-semibold text-gray-900">Notes</h3>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                              </Button>
                            </div>
                            <div className="bg-gray-50 rounded-md p-4 border">
                              {selectedContact.notes || 'No notes added yet.'}
                            </div>
                          </div>
                        </div>
                        
                        {/* Equipment Summary */}
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-4">Equipment Summary</h3>
                          
                          {selectedContact.equipment.length === 0 ? (
                            <div className="bg-gray-50 rounded-md p-8 text-center border border-dashed">
                              <Wrench className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-500 mb-4">No equipment registered yet</p>
                              <Button>
                                <Plus className="h-4 w-4 mr-1" /> Add Equipment
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {selectedContact.equipment.map(equip => (
                                <div key={equip.id} className="bg-gray-50 rounded-md p-4 border">
                                  <div className="flex justify-between">
                                    <h4 className="font-medium">{equip.type}</h4>
                                    <Badge
                                      className={cn(
                                        getEquipmentStatus(equip) === 'overdue' && 'bg-red-100 text-red-800 border-red-200',
                                        getEquipmentStatus(equip) === 'due-soon' && 'bg-yellow-100 text-yellow-800 border-yellow-200',
                                        getEquipmentStatus(equip) === 'good' && 'bg-green-100 text-green-800 border-green-200'
                                      )}
                                    >
                                      <CalendarClock className="h-3 w-3 mr-1" />
                                      {equip.last_service ? formatDate(equip.last_service) : 'No service record'}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1">{equip.brand} {equip.model}</p>
                                  <div className="mt-3 pt-3 border-t border-gray-200 text-sm flex justify-between">
                                    <span>Serial: {equip.serial}</span>
                                    <span>Installed: {equip.install_year}</span>
                                  </div>
                                </div>
                              ))}
                              
                              <div className="text-center mt-3">
                                <Button variant="outline">
                                  <Plus className="h-4 w-4 mr-1" /> Add Equipment
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {/* Quick Actions */}
                          <div className="mt-8">
                            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-2 gap-3">
                              <Button variant="outline" className="justify-start">
                                <Calendar className="h-4 w-4 mr-2" /> Schedule Service
                              </Button>
                              <Button variant="outline" className="justify-start">
                                <MessageSquare className="h-4 w-4 mr-2" /> Send Message
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="equipment" className="m-0">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-gray-900">Equipment List</h3>
                        <Button>
                          <Plus className="h-4 w-4 mr-1" /> Add Equipment
                        </Button>
                      </div>
                      
                      {selectedContact.equipment.length === 0 ? (
                        <div className="bg-gray-50 rounded-md p-8 text-center border border-dashed">
                          <Wrench className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 mb-4">No equipment registered yet</p>
                          <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
                            Adding equipment helps track maintenance history and service intervals
                          </p>
                          <Button>
                            <Plus className="h-4 w-4 mr-1" /> Add First Equipment
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {selectedContact.equipment.map(equip => (
                            <div key={equip.id} className="bg-white rounded-md border p-4 hover:shadow-sm transition-shadow">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium text-lg">{equip.type}</h4>
                                  <p className="text-gray-500">{equip.brand} {equip.model}</p>
                                </div>
                                <Badge
                                  className={cn(
                                    getEquipmentStatus(equip) === 'overdue' && 'bg-red-100 text-red-800 border-red-200',
                                    getEquipmentStatus(equip) === 'due-soon' && 'bg-yellow-100 text-yellow-800 border-yellow-200',
                                    getEquipmentStatus(equip) === 'good' && 'bg-green-100 text-green-800 border-green-200'
                                  )}
                                >
                                  <CalendarClock className="h-3 w-3 mr-1" />
                                  {equip.last_service ? 'Last service: ' + formatDate(equip.last_service) : 'No service record'}
                                </Badge>
                              </div>
                              
                              <div className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
                                <div>
                                  <span className="text-gray-500">Serial Number:</span> {equip.serial}
                                </div>
                                <div>
                                  <span className="text-gray-500">Installed:</span> {equip.install_year}
                                </div>
                                <div>
                                  <span className="text-gray-500">Warranty Until:</span> {equip.warranty_end ? formatDate(equip.warranty_end) : 'Unknown'}
                                </div>
                                <div>
                                  <span className="text-gray-500">Next Service:</span> {
                                    equip.last_service 
                                      ? (() => {
                                          const nextServiceDate = new Date(equip.last_service);
                                          nextServiceDate.setFullYear(nextServiceDate.getFullYear() + 1);
                                          return formatDate(nextServiceDate.toISOString());
                                        })()
                                      : 'Not scheduled'
                                  }
                                </div>
                              </div>
                              
                              <div className="mt-4 pt-3 border-t flex justify-end space-x-2">
                                <Button variant="outline" size="sm">
                                  <Calendar className="h-3.5 w-3.5 mr-1" /> Schedule Service
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="history" className="m-0">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-gray-900">Service History</h3>
                        <Button variant="outline">
                          <Filter className="h-4 w-4 mr-1" /> Filter
                        </Button>
                      </div>
                      
                      <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200"></div>
                        
                        <div className="space-y-6 pl-10 relative">
                          <div className="relative">
                            <div className="absolute -left-10 mt-1.5 w-6 h-6 rounded-full bg-blue-100 border-2 border-white shadow flex items-center justify-center">
                              <Wrench className="h-3 w-3 text-blue-700" />
                            </div>
                            <div>
                              <div className="flex flex-wrap gap-2 items-center mb-1">
                                <h4 className="font-medium">Annual Maintenance</h4>
                                <Badge variant="outline">AC System</Badge>
                                <span className="text-sm text-gray-500">Apr 15, 2023</span>
                              </div>
                              <p className="text-sm text-gray-600">Performed full system maintenance check. Replaced air filter and cleaned condenser coils.</p>
                              <div className="mt-2">
                                <Button variant="link" size="sm" className="h-auto p-0 text-blue-600">
                                  View service report <ChevronRight className="h-3 w-3 ml-1" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="relative">
                            <div className="absolute -left-10 mt-1.5 w-6 h-6 rounded-full bg-yellow-100 border-2 border-white shadow flex items-center justify-center">
                              <Wrench className="h-3 w-3 text-yellow-700" />
                            </div>
                            <div>
                              <div className="flex flex-wrap gap-2 items-center mb-1">
                                <h4 className="font-medium">Emergency Repair</h4>
                                <Badge variant="outline">Furnace</Badge>
                                <span className="text-sm text-gray-500">Sep 10, 2022</span>
                              </div>
                              <p className="text-sm text-gray-600">Replaced faulty ignitor that was preventing furnace from starting.</p>
                              <div className="mt-2">
                                <Button variant="link" size="sm" className="h-auto p-0 text-blue-600">
                                  View service report <ChevronRight className="h-3 w-3 ml-1" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="relative">
                            <div className="absolute -left-10 mt-1.5 w-6 h-6 rounded-full bg-green-100 border-2 border-white shadow flex items-center justify-center">
                              <Wrench className="h-3 w-3 text-green-700" />
                            </div>
                            <div>
                              <div className="flex flex-wrap gap-2 items-center mb-1">
                                <h4 className="font-medium">Installation</h4>
                                <Badge variant="outline">AC System</Badge>
                                <span className="text-sm text-gray-500">Mar 15, 2020</span>
                              </div>
                              <p className="text-sm text-gray-600">Initial installation of Carrier Infinity 26 AC system.</p>
                              <div className="mt-2">
                                <Button variant="link" size="sm" className="h-auto p-0 text-blue-600">
                                  View installation details <ChevronRight className="h-3 w-3 ml-1" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal for adding contact would be here */}
    </MainLayout>
  );
}