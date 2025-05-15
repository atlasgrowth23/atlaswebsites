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
  AlertCircle,
  CheckCircle,
  Clock
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
  const [tab, setTab] = useState('all'); // 'all', 'residential', 'commercial'
  
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
  
  // Get the status badge for equipment
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'overdue':
        return (
          <Badge variant="outline" className="bg-gray-50 text-red-700 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1 fill-red-100" />
            Service Overdue
          </Badge>
        );
      case 'due-soon':
        return (
          <Badge variant="outline" className="bg-gray-50 text-amber-700 border-amber-200">
            <Clock className="h-3 w-3 mr-1" />
            Service Due Soon
          </Badge>
        );
      case 'good':
        return (
          <Badge variant="outline" className="bg-gray-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Service Up-to-date
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            No Service Records
          </Badge>
        );
    }
  };

  return (
    <MainLayout title="Contacts & Equipment">
      <Head>
        <title>Contacts & Equipment - HVAC Pro</title>
        <meta name="description" content="Manage your customer contacts and equipment" />
      </Head>
      
      <div>
        {/* Page header */}
        <div className="border-b border-gray-200 pb-5 mb-5 flex flex-wrap items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your customer contacts and equipment
            </p>
          </div>
          <div className="mt-3 sm:mt-0 flex space-x-3">
            <Button 
              variant="outline"
              className="text-gray-700 border-gray-300 h-9"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button className="bg-gray-900 hover:bg-gray-800 h-9">
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </div>
        
        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 mb-5">
          <Tabs 
            value={tab} 
            onValueChange={setTab}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid grid-cols-3 w-full sm:w-auto bg-gray-100 p-1">
              <TabsTrigger 
                value="all" 
                className="text-sm data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-none"
              >
                All Customers
              </TabsTrigger>
              <TabsTrigger 
                value="residential" 
                className="text-sm data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-none"
              >
                Residential
              </TabsTrigger>
              <TabsTrigger 
                value="commercial" 
                className="text-sm data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-none"
              >
                Commercial
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search customers..." 
              className="pl-9 w-full sm:w-80 h-9 border-gray-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Main content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-10 gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">Customer</div>
              <div className="col-span-2">Contact</div>
              <div className="col-span-2">Location</div>
              <div className="col-span-2">Equipment Status</div>
              <div className="col-span-1">Actions</div>
            </div>
            
            {/* Table body */}
            <div className="divide-y divide-gray-200 bg-white">
              {filteredContacts.length === 0 ? (
                <div className="px-6 py-10 text-center text-gray-500">
                  No customers found matching your search.
                </div>
              ) : (
                filteredContacts.map(contact => (
                  <div
                    key={contact.id}
                    className={cn(
                      "grid grid-cols-10 gap-4 px-6 py-4",
                      selectedContact?.id === contact.id ? "bg-gray-50" : "hover:bg-gray-50"
                    )}
                    onClick={() => setSelectedContact(contact)}
                  >
                    <div className="col-span-3 flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded bg-gray-200 flex items-center justify-center text-gray-600">
                        {getInitials(contact.name)}
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">{contact.name}</div>
                        <div className="text-sm text-gray-500">Customer since {formatDate(contact.customer_since)}</div>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center text-sm text-gray-700">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {contact.phone}
                      </div>
                      <div className="flex items-center text-sm text-gray-700 mt-1">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {contact.email}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-start text-sm text-gray-700">
                        <MapPin className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                        <div>
                          <div>{contact.street}</div>
                          <div>{contact.city}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2">
                      {contact.equipment.length === 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-gray-100 text-gray-800">
                          No equipment
                        </span>
                      ) : (
                        <div>
                          <div className="text-sm text-gray-900 font-medium">{contact.equipment.length} equipment items</div>
                          {/* Show the status of the equipment that needs attention first */}
                          {contact.equipment.some(e => getEquipmentStatus(e) === 'overdue') ? (
                            <Badge variant="outline" className="mt-1 text-xs bg-gray-50 text-red-700 border-red-200">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Service Overdue
                            </Badge>
                          ) : contact.equipment.some(e => getEquipmentStatus(e) === 'due-soon') ? (
                            <Badge variant="outline" className="mt-1 text-xs bg-gray-50 text-amber-700 border-amber-200">
                              <Clock className="h-3 w-3 mr-1" />
                              Service Due Soon
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="mt-1 text-xs bg-gray-50 text-green-700 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              All Up-to-date
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem className="cursor-pointer">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <Wrench className="h-4 w-4 mr-2" />
                            Add Equipment
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <Calendar className="h-4 w-4 mr-2" />
                            Schedule Service
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="cursor-pointer text-red-600">
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
          </div>
        )}
        
        {/* Contact detail panel */}
        {selectedContact && (
          <div className="mt-6 bg-white border border-gray-200 rounded-md">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center text-gray-600">
                  {getInitials(selectedContact.name)}
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-medium text-gray-900">{selectedContact.name}</h2>
                  <p className="text-sm text-gray-500">Customer since {formatDate(selectedContact.customer_since)}</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" size="sm" className="text-gray-700 h-9">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message
                </Button>
                <Button variant="outline" size="sm" className="text-gray-700 h-9">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
                <Button size="sm" className="bg-gray-900 hover:bg-gray-800 h-9">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
            
            <div className="px-6 py-4">
              <Tabs defaultValue="details">
                <TabsList className="border-b border-gray-200 w-full justify-start pb-0 mb-4">
                  <TabsTrigger 
                    value="details" 
                    className="text-sm data-[state=active]:border-b-2 data-[state=active]:border-gray-900 data-[state=active]:shadow-none rounded-none pb-2 px-4"
                  >
                    Contact Details
                  </TabsTrigger>
                  <TabsTrigger 
                    value="equipment" 
                    className="text-sm data-[state=active]:border-b-2 data-[state=active]:border-gray-900 data-[state=active]:shadow-none rounded-none pb-2 px-4"
                  >
                    Equipment ({selectedContact.equipment.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="service" 
                    className="text-sm data-[state=active]:border-b-2 data-[state=active]:border-gray-900 data-[state=active]:shadow-none rounded-none pb-2 px-4"
                  >
                    Service History
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="mt-0 p-1">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Contact Information</h3>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 text-gray-400 mr-2" />
                            <a href={`tel:${selectedContact.phone}`} className="text-gray-900 hover:text-gray-700">
                              {selectedContact.phone}
                            </a>
                          </div>
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 text-gray-400 mr-2" />
                            <a href={`mailto:${selectedContact.email}`} className="text-gray-900 hover:text-gray-700">
                              {selectedContact.email}
                            </a>
                          </div>
                          <div className="flex items-start">
                            <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                            <div>
                              <div>{selectedContact.street}</div>
                              <div>{selectedContact.city}</div>
                              <a 
                                href={`https://maps.google.com/?q=${encodeURIComponent(
                                  `${selectedContact.street}, ${selectedContact.city}`
                                )}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-gray-700 hover:text-gray-900 mt-1 inline-block"
                              >
                                View on map
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="md:col-span-2">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                      <div className="bg-gray-50 rounded border border-gray-200 p-3 min-h-[120px]">
                        {selectedContact.notes || 'No notes added yet.'}
                      </div>
                      
                      {selectedContact.equipment.length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-sm font-medium text-gray-500 mb-2">Equipment Summary</h3>
                          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                            {selectedContact.equipment.map(equip => (
                              <div key={equip.id} className="bg-gray-50 border border-gray-200 rounded p-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-medium text-gray-900">{equip.type}</h4>
                                    <p className="text-sm text-gray-500">{equip.brand} {equip.model}</p>
                                  </div>
                                  {getStatusBadge(getEquipmentStatus(equip))}
                                </div>
                                <div className="mt-2 text-xs text-gray-500 flex items-center">
                                  <span className="font-medium">Serial:</span> 
                                  <span className="ml-1">{equip.serial}</span>
                                  <span className="mx-2">•</span>
                                  <span className="font-medium">Installed:</span>
                                  <span className="ml-1">{equip.install_year}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="equipment" className="mt-0 p-1">
                  {selectedContact.equipment.length === 0 ? (
                    <div className="bg-gray-50 rounded-md border border-gray-200 p-8 text-center">
                      <Wrench className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 mb-4">No equipment registered yet</p>
                      <Button className="bg-gray-900 hover:bg-gray-800">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Equipment
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">Equipment List</h3>
                        <Button className="bg-gray-900 hover:bg-gray-800">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Equipment
                        </Button>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-md overflow-hidden">
                        {/* Equipment table header */}
                        <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-gray-200 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="col-span-3">Equipment</div>
                          <div className="col-span-2">Serial</div>
                          <div className="col-span-1">Year</div>
                          <div className="col-span-2">Last Service</div>
                          <div className="col-span-2">Warranty Until</div>
                          <div className="col-span-2 text-right">Actions</div>
                        </div>
                        
                        {/* Equipment table rows */}
                        <div className="divide-y divide-gray-200">
                          {selectedContact.equipment.map(equip => {
                            const status = getEquipmentStatus(equip);
                            
                            return (
                              <div key={equip.id} className="grid grid-cols-12 gap-4 px-4 py-3 text-sm">
                                <div className="col-span-3">
                                  <div className="font-medium text-gray-900">{equip.type}</div>
                                  <div className="text-gray-500">{equip.brand} {equip.model}</div>
                                </div>
                                <div className="col-span-2 self-center text-gray-700">
                                  {equip.serial}
                                </div>
                                <div className="col-span-1 self-center text-gray-700">
                                  {equip.install_year}
                                </div>
                                <div className="col-span-2 self-center">
                                  {equip.last_service ? (
                                    <div className={cn(
                                      "flex items-center",
                                      status === 'overdue' ? "text-red-700" : 
                                      status === 'due-soon' ? "text-amber-700" : 
                                      "text-green-700"
                                    )}>
                                      {status === 'overdue' ? (
                                        <AlertCircle className="h-4 w-4 mr-1" />
                                      ) : status === 'due-soon' ? (
                                        <Clock className="h-4 w-4 mr-1" />
                                      ) : (
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                      )}
                                      {formatDate(equip.last_service)}
                                    </div>
                                  ) : (
                                    <span className="text-gray-500">Not serviced</span>
                                  )}
                                </div>
                                <div className="col-span-2 self-center text-gray-700">
                                  {equip.warranty_end ? formatDate(equip.warranty_end) : 'Unknown'}
                                </div>
                                <div className="col-span-2 self-center text-right">
                                  <Button variant="outline" size="sm" className="h-8 mr-1">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    Service
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-8 px-2">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="service" className="mt-0 p-1">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">Service History</h3>
                      <Button className="bg-gray-900 hover:bg-gray-800">
                        <Plus className="h-4 w-4 mr-2" />
                        Schedule Service
                      </Button>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-md">
                      <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-gray-200 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="col-span-2">Date</div>
                        <div className="col-span-2">Service Type</div>
                        <div className="col-span-2">Equipment</div>
                        <div className="col-span-2">Technician</div>
                        <div className="col-span-3">Notes</div>
                        <div className="col-span-1 text-right">Actions</div>
                      </div>
                      
                      <div className="divide-y divide-gray-200">
                        <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm">
                          <div className="col-span-2 font-medium text-gray-900">Apr 15, 2023</div>
                          <div className="col-span-2 text-gray-700">
                            <div>Annual Maintenance</div>
                            <Badge variant="outline" className="mt-1 text-xs">Completed</Badge>
                          </div>
                          <div className="col-span-2 text-gray-700">AC System</div>
                          <div className="col-span-2 text-gray-700">Mike Johnson</div>
                          <div className="col-span-3 text-gray-500">
                            Performed full system maintenance check. Replaced air filter and cleaned condenser coils.
                          </div>
                          <div className="col-span-1 text-right">
                            <Button variant="ghost" size="sm" className="h-8 px-2">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm">
                          <div className="col-span-2 font-medium text-gray-900">Sep 10, 2022</div>
                          <div className="col-span-2 text-gray-700">
                            <div>Emergency Repair</div>
                            <Badge variant="outline" className="mt-1 text-xs text-red-700 border-red-200 bg-red-50">Emergency</Badge>
                          </div>
                          <div className="col-span-2 text-gray-700">Furnace</div>
                          <div className="col-span-2 text-gray-700">Sarah Lee</div>
                          <div className="col-span-3 text-gray-500">
                            Replaced faulty ignitor that was preventing furnace from starting.
                          </div>
                          <div className="col-span-1 text-right">
                            <Button variant="ghost" size="sm" className="h-8 px-2">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm">
                          <div className="col-span-2 font-medium text-gray-900">Mar 15, 2020</div>
                          <div className="col-span-2 text-gray-700">
                            <div>Installation</div>
                            <Badge variant="outline" className="mt-1 text-xs">Completed</Badge>
                          </div>
                          <div className="col-span-2 text-gray-700">AC System</div>
                          <div className="col-span-2 text-gray-700">David Miller</div>
                          <div className="col-span-3 text-gray-500">
                            Initial installation of Carrier Infinity 26 AC system.
                          </div>
                          <div className="col-span-1 text-right">
                            <Button variant="ghost" size="sm" className="h-8 px-2">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}