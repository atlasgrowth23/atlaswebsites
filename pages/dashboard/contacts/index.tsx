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
  Clock,
  X
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

interface ServiceRecord {
  id: string;
  date: string;
  service_type: string;
  equipment_id: string;
  equipment_type: string;
  technician: string;
  status: 'completed' | 'scheduled' | 'emergency';
  notes: string;
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
  type: 'residential' | 'commercial';
  equipment: Equipment[];
  service_history: ServiceRecord[];
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactDetailOpen, setContactDetailOpen] = useState(false);
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
          type: 'residential',
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
          ],
          service_history: [
            {
              id: 'SH101',
              date: '2023-04-15',
              service_type: 'Annual Maintenance',
              equipment_id: '101',
              equipment_type: 'Air Conditioner',
              technician: 'Mike Johnson',
              status: 'completed',
              notes: 'Performed full system maintenance check. Replaced air filter and cleaned condenser coils.'
            },
            {
              id: 'SH102',
              date: '2022-09-10',
              service_type: 'Emergency Repair',
              equipment_id: '102',
              equipment_type: 'Furnace',
              technician: 'Sarah Lee',
              status: 'emergency',
              notes: 'Replaced faulty ignitor that was preventing furnace from starting.'
            },
            {
              id: 'SH103',
              date: '2020-03-15',
              service_type: 'Installation',
              equipment_id: '101',
              equipment_type: 'Air Conditioner',
              technician: 'David Miller',
              status: 'completed',
              notes: 'Initial installation of Carrier Infinity 26 AC system.'
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
          type: 'residential',
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
          ],
          service_history: [
            {
              id: 'SH201',
              date: '2023-11-05',
              service_type: 'Annual Maintenance',
              equipment_id: '201',
              equipment_type: 'Heat Pump',
              technician: 'Mike Johnson',
              status: 'completed',
              notes: 'Performed seasonal maintenance. System working properly.'
            },
            {
              id: 'SH202',
              date: '2021-07-22',
              service_type: 'Installation',
              equipment_id: '201',
              equipment_type: 'Heat Pump',
              technician: 'David Miller',
              status: 'completed',
              notes: 'Initial installation of Lennox XP25 heat pump system.'
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
          type: 'residential',
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
          ],
          service_history: [
            {
              id: 'SH301',
              date: '2023-10-15',
              service_type: 'Annual Maintenance',
              equipment_id: '301',
              equipment_type: 'Furnace',
              technician: 'Sarah Lee',
              status: 'completed',
              notes: 'Performed annual furnace maintenance. All systems normal.'
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
          type: 'residential',
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
          ],
          service_history: [
            {
              id: 'SH401',
              date: '2023-05-20',
              service_type: 'Annual Maintenance',
              equipment_id: '401',
              equipment_type: 'Air Conditioner',
              technician: 'Mike Johnson',
              status: 'completed',
              notes: 'Performed annual AC maintenance. System working properly.'
            }
          ]
        },
        {
          id: '5',
          name: 'Oakridge Office Complex',
          phone: '(555) 876-5432',
          email: 'manager@oakridgeoffices.com',
          street: '555 Cedar Ln',
          city: 'Oakville, TX 78570',
          notes: 'Commercial property with 15 individual office units. Contact property manager for access.',
          customer_since: '2019-11-03',
          type: 'commercial',
          equipment: [
            {
              id: '501',
              type: 'Commercial HVAC System',
              brand: 'American Standard',
              model: 'Foundation™ Rooftop Unit',
              install_year: 2019,
              serial: 'AS87654321',
              last_service: '2023-08-28',
              warranty_end: '2029-11-03'
            },
            {
              id: '502',
              type: 'Building Management System',
              brand: 'Honeywell',
              model: 'Enterprise Buildings Integrator',
              install_year: 2019,
              serial: 'HW12345678',
              last_service: '2023-08-28',
              warranty_end: '2029-11-03'
            }
          ],
          service_history: [
            {
              id: 'SH501',
              date: '2023-08-28',
              service_type: 'Quarterly Maintenance',
              equipment_id: '501',
              equipment_type: 'Commercial HVAC System',
              technician: 'David Miller',
              status: 'completed',
              notes: 'Performed quarterly maintenance on all rooftop units. Replaced filters.'
            },
            {
              id: 'SH502',
              date: '2025-05-25',
              service_type: 'Scheduled Maintenance',
              equipment_id: '501',
              equipment_type: 'Commercial HVAC System',
              technician: 'Mike Johnson',
              status: 'scheduled',
              notes: 'Scheduled quarterly maintenance for all units.'
            }
          ]
        }
      ];
      
      setContacts(mockContacts);
      setLoading(false);
    }, 800);
  }, []);
  
  // Filter contacts based on tab and search
  const filteredContacts = contacts.filter(contact => {
    // Filter by tab
    if (tab === 'residential' && contact.type !== 'residential') return false;
    if (tab === 'commercial' && contact.type !== 'commercial') return false;
    
    // Filter by search term
    if (searchTerm) {
      return (
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone.includes(searchTerm) ||
        contact.street.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return true;
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
  
  // Handle contact selection
  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setContactDetailOpen(true);
  };
  
  // Handle contact close
  const handleContactClose = () => {
    setContactDetailOpen(false);
  };
  
  // Get the status badge for equipment
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'overdue':
        return (
          <Badge variant="outline" className="bg-gray-50 text-red-700 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
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
        <div className="flex h-[calc(100vh-240px)]">
          {/* Customer list */}
          <div className={cn(
            "bg-white border border-gray-200 rounded-md overflow-hidden transition-all w-full",
            contactDetailOpen ? "lg:w-2/5" : "w-full"
          )}>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
              </div>
            ) : (
              <>
                {/* Table header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="col-span-5 sm:col-span-5">Customer</div>
                  <div className="col-span-4 sm:col-span-4">Contact</div>
                  <div className="hidden sm:block sm:col-span-2">Type</div>
                  <div className="col-span-3 sm:col-span-1 text-right">Actions</div>
                </div>
                
                {/* Table body */}
                <div className="divide-y divide-gray-200 bg-white overflow-y-auto" style={{ maxHeight: 'calc(100vh - 290px)' }}>
                  {filteredContacts.length === 0 ? (
                    <div className="px-6 py-10 text-center text-gray-500">
                      No customers found matching your search.
                    </div>
                  ) : (
                    filteredContacts.map(contact => (
                      <div
                        key={contact.id}
                        className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleContactSelect(contact)}
                      >
                        <div className="col-span-5 sm:col-span-5 flex items-center">
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
                        <div className="hidden sm:block sm:col-span-2">
                          <Badge variant="outline" className="capitalize">
                            {contact.type}
                          </Badge>
                        </div>
                        <div className="col-span-3 sm:col-span-1 flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem 
                                className="cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleContactSelect(contact);
                                }}
                              >
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Calendar className="h-4 w-4 mr-2" />
                                Schedule Service
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="cursor-pointer text-red-600"
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
          
          {/* Contact detail panel - Slide in from right */}
          {selectedContact && (
            <div className={cn(
              "bg-white border border-gray-200 rounded-md ml-0 lg:ml-5 overflow-hidden transition-all fixed lg:relative right-0 top-0 h-screen lg:h-auto z-10 lg:z-0 w-full lg:w-3/5",
              contactDetailOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0 lg:hidden"
            )}>
              <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
                <div className="px-6 py-4 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="lg:hidden">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="mr-2"
                        onClick={handleContactClose}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
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
                
                <Tabs defaultValue="details" className="px-6">
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
                      Equipment ({selectedContact.equipment.length})
                    </TabsTrigger>
                    <TabsTrigger 
                      value="service" 
                      className="text-sm data-[state=active]:border-b-2 data-[state=active]:border-gray-900 data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none py-2 px-4"
                    >
                      Service History
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 150px)' }}>
                <TabsContent value="details" className="mt-0 p-0">
                  <div className="space-y-6">
                    {/* Contact Information */}
                    <div>
                      <h3 className="text-base font-medium text-gray-900 mb-4">Contact Information</h3>
                      <div className="space-y-4">
                        <div className="flex items-center p-3 bg-gray-50 rounded-md border border-gray-200">
                          <Phone className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <a 
                              href={`tel:${selectedContact.phone}`} 
                              className="text-gray-900 hover:text-gray-700"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {selectedContact.phone}
                            </a>
                            <p className="text-xs text-gray-500">Primary Phone</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center p-3 bg-gray-50 rounded-md border border-gray-200">
                          <Mail className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <a 
                              href={`mailto:${selectedContact.email}`} 
                              className="text-gray-900 hover:text-gray-700"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {selectedContact.email}
                            </a>
                            <p className="text-xs text-gray-500">Email Address</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start p-3 bg-gray-50 rounded-md border border-gray-200">
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
                              className="text-sm text-gray-700 hover:text-gray-900 mt-1 inline-block"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View on map
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Notes */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base font-medium text-gray-900">Customer Notes</h3>
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit Notes
                        </Button>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-md border border-gray-200 min-h-[100px]">
                        {selectedContact.notes || 'No notes available for this customer.'}
                      </div>
                    </div>
                    
                    {/* Equipment Summary */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base font-medium text-gray-900">Equipment Summary</h3>
                        {selectedContact.equipment.length > 0 && (
                          <Button variant="outline" size="sm" className="h-7 text-xs">
                            <Wrench className="h-3 w-3 mr-1" />
                            Manage Equipment
                          </Button>
                        )}
                      </div>
                      
                      {selectedContact.equipment.length === 0 ? (
                        <div className="p-8 bg-gray-50 rounded-md border border-dashed border-gray-300 text-center">
                          <Wrench className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 mb-4">No equipment registered for this customer</p>
                          <Button size="sm" className="bg-gray-900 hover:bg-gray-800">
                            <Plus className="h-4 w-4 mr-1" />
                            Add Equipment
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedContact.equipment.map(equip => (
                            <div 
                              key={equip.id} 
                              className="bg-gray-50 rounded-md border border-gray-200 p-4 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium text-gray-900">{equip.type}</h4>
                                  <p className="text-sm text-gray-500 mt-1">{equip.brand} {equip.model}</p>
                                </div>
                                {getStatusBadge(getEquipmentStatus(equip))}
                              </div>
                              <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-2 text-sm text-gray-700">
                                <div>
                                  <span className="font-medium text-gray-900">Serial:</span> {equip.serial}
                                </div>
                                <div>
                                  <span className="font-medium text-gray-900">Installed:</span> {equip.install_year}
                                </div>
                                <div>
                                  <span className="font-medium text-gray-900">Last Service:</span> {equip.last_service ? formatDate(equip.last_service) : 'Never'}
                                </div>
                                <div>
                                  <span className="font-medium text-gray-900">Warranty Until:</span> {equip.warranty_end ? formatDate(equip.warranty_end) : 'Unknown'}
                                </div>
                              </div>
                              <div className="mt-3 flex justify-end">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8"
                                >
                                  <Calendar className="h-4 w-4 mr-1" />
                                  Schedule Service
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="equipment" className="mt-0 p-0">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-base font-medium text-gray-900">Equipment List</h3>
                      <Button size="sm" className="bg-gray-900 hover:bg-gray-800 h-9">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Equipment
                      </Button>
                    </div>
                    
                    {selectedContact.equipment.length === 0 ? (
                      <div className="bg-gray-50 rounded-md border border-dashed border-gray-300 p-8 text-center">
                        <Wrench className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 mb-4">No equipment registered yet</p>
                        <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
                          Adding equipment helps track maintenance history and service intervals
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                        {/* Equipment table header */}
                        <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="col-span-4">Equipment</div>
                          <div className="col-span-2">Serial</div>
                          <div className="col-span-1">Year</div>
                          <div className="col-span-2">Last Service</div>
                          <div className="col-span-2">Status</div>
                          <div className="col-span-1"></div>
                        </div>
                        
                        {/* Equipment table rows */}
                        <div className="divide-y divide-gray-200">
                          {selectedContact.equipment.map(equip => {
                            const status = getEquipmentStatus(equip);
                            
                            return (
                              <div key={equip.id} className="grid grid-cols-12 gap-4 px-4 py-3 text-sm hover:bg-gray-50">
                                <div className="col-span-4">
                                  <div className="font-medium text-gray-900">{equip.type}</div>
                                  <div className="text-gray-500">{equip.brand} {equip.model}</div>
                                </div>
                                <div className="col-span-2 self-center text-gray-700">
                                  {equip.serial}
                                </div>
                                <div className="col-span-1 self-center text-gray-700">
                                  {equip.install_year}
                                </div>
                                <div className="col-span-2 self-center text-gray-700">
                                  {equip.last_service ? formatDate(equip.last_service) : 'Never'}
                                </div>
                                <div className="col-span-2 self-center">
                                  {getStatusBadge(status)}
                                </div>
                                <div className="col-span-1 self-center text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40">
                                      <DropdownMenuItem className="cursor-pointer">
                                        View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="cursor-pointer">
                                        Edit Equipment
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="cursor-pointer">
                                        Schedule Service
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="cursor-pointer text-red-600">
                                        Remove Equipment
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="service" className="mt-0 p-0">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-base font-medium text-gray-900">Service History</h3>
                      <Button size="sm" className="bg-gray-900 hover:bg-gray-800 h-9">
                        <Plus className="h-4 w-4 mr-1" />
                        Schedule Service
                      </Button>
                    </div>
                    
                    {selectedContact.service_history.length === 0 ? (
                      <div className="bg-gray-50 rounded-md border border-dashed border-gray-300 p-8 text-center">
                        <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 mb-4">No service history available</p>
                        <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
                          This customer hasn't had any service appointments yet
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                        <div className="grid grid-cols-10 gap-4 px-4 py-2 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="col-span-2">Date</div>
                          <div className="col-span-2">Service Type</div>
                          <div className="col-span-2">Equipment</div>
                          <div className="col-span-2">Technician</div>
                          <div className="col-span-1">Status</div>
                          <div className="col-span-1"></div>
                        </div>
                        
                        <div className="divide-y divide-gray-200">
                          {selectedContact.service_history
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map(service => (
                            <div key={service.id} className="grid grid-cols-10 gap-4 px-4 py-3 text-sm hover:bg-gray-50">
                              <div className="col-span-2 font-medium text-gray-900">
                                {formatDate(service.date)}
                              </div>
                              <div className="col-span-2 text-gray-700">
                                {service.service_type}
                              </div>
                              <div className="col-span-2 text-gray-700">
                                {service.equipment_type}
                              </div>
                              <div className="col-span-2 text-gray-700">
                                {service.technician}
                              </div>
                              <div className="col-span-1">
                                <Badge variant="outline" className={cn(
                                  service.status === 'emergency' && "bg-red-50 text-red-700 border-red-200",
                                  service.status === 'scheduled' && "bg-blue-50 text-blue-700 border-blue-200",
                                  service.status === 'completed' && "bg-green-50 text-green-700 border-green-200"
                                )}>
                                  {service.status}
                                </Badge>
                              </div>
                              <div className="col-span-1 text-right">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}