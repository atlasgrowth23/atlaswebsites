import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/dashboard/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar } from '@/components/ui/avatar';
import { 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  Info, 
  Edit2, 
  Trash2, 
  Settings,
  ArrowRight
} from 'lucide-react';

// Types for the contacts page
interface Equipment {
  id: string;
  type: string;
  brand: string;
  model: string;
  install_year: number;
  serial: string;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  notes: string;
  equipment: Equipment[];
}

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mocked data for demonstration - this would be replaced with an API call
  useEffect(() => {
    const mockContacts: Contact[] = [
      {
        id: '1',
        name: 'John Smith',
        phone: '(555) 123-4567',
        email: 'john.smith@example.com',
        street: '123 Main St',
        city: 'Anytown, CA 95012',
        notes: 'Prefers afternoon appointments. Has a large dog in the backyard.',
        equipment: [
          {
            id: '101',
            type: 'Air Conditioner',
            brand: 'Carrier',
            model: 'Infinity 26',
            install_year: 2020,
            serial: 'CA12345678'
          },
          {
            id: '102',
            type: 'Furnace',
            brand: 'Trane',
            model: 'XC95m',
            install_year: 2019,
            serial: 'TR98765432'
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
        equipment: [
          {
            id: '201',
            type: 'Heat Pump',
            brand: 'Lennox',
            model: 'XP25',
            install_year: 2021,
            serial: 'LX87654321'
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
        equipment: [
          {
            id: '301',
            type: 'Furnace',
            brand: 'Rheem',
            model: 'R96V',
            install_year: 2018,
            serial: 'RH56781234'
          },
          {
            id: '302',
            type: 'Thermostat',
            brand: 'Nest',
            model: 'Learning Thermostat (3rd Gen)',
            install_year: 2020,
            serial: 'NT44556677'
          }
        ]
      }
    ];
    
    // Simulate API delay
    setTimeout(() => {
      setContacts(mockContacts);
      setSelectedContact(mockContacts[0]);
      setIsLoading(false);
    }, 800);
  }, []);
  
  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm)
  );
  
  // Handle selecting a contact
  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
  };
  
  return (
    <DashboardLayout title="Contacts & Equipment">
      <Head>
        <title>Contacts & Equipment | HVAC Dashboard</title>
      </Head>
      
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
        {/* Sidebar with search and contact list */}
        <div className="w-full md:w-1/3">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Contacts</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Contact
                </Button>
              </div>
              <div className="relative mt-2">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            
            <CardContent className="overflow-y-auto flex-grow">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No contacts found</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {filteredContacts.map(contact => (
                    <li key={contact.id}>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start p-3 ${selectedContact?.id === contact.id ? 'bg-blue-50' : ''}`}
                        onClick={() => handleContactSelect(contact)}
                      >
                        <div className="mr-3">
                          <Avatar className="h-10 w-10">
                            <div className="bg-blue-100 h-10 w-10 rounded-full flex items-center justify-center text-blue-700 font-semibold">
                              {contact.name.split(' ').map(n => n[0]).join('')}
                            </div>
                          </Avatar>
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{contact.name}</p>
                          <p className="text-xs text-gray-500">{contact.phone}</p>
                        </div>
                        {contact.equipment.length > 0 && (
                          <Badge variant="outline" className="ml-auto">
                            {contact.equipment.length} items
                          </Badge>
                        )}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Main content area for contact details and equipment */}
        <div className="w-full md:w-2/3">
          {selectedContact ? (
            <Tabs defaultValue="details" className="h-full flex flex-col">
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{selectedContact.name}</CardTitle>
                      <CardDescription>{selectedContact.city}</CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-1" />
                        More
                      </Button>
                    </div>
                  </div>
                  
                  <TabsList className="mt-4">
                    <TabsTrigger value="details">Contact Details</TabsTrigger>
                    <TabsTrigger value="equipment">Equipment ({selectedContact.equipment.length})</TabsTrigger>
                  </TabsList>
                </CardHeader>
                
                <CardContent className="flex-grow overflow-auto pt-5">
                  <TabsContent value="details" className="h-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Contact Information */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-3">Contact Information</h3>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-3 text-gray-400" />
                            <div>
                              <p>{selectedContact.phone}</p>
                              <p className="text-xs text-gray-500">Primary</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-3 text-gray-400" />
                            <div>
                              <p>{selectedContact.email}</p>
                              <p className="text-xs text-gray-500">Primary</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <MapPin className="h-4 w-4 mr-3 mt-0.5 text-gray-400" />
                            <div>
                              <p>{selectedContact.street}</p>
                              <p>{selectedContact.city}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Notes Section */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-md min-h-[120px]">
                          {selectedContact.notes || 'No notes added yet.'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Recent Activity */}
                    <div className="mt-8">
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Recent Activity</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center">
                            <div className="bg-purple-100 p-2 rounded-full mr-3">
                              <Settings className="h-4 w-4 text-purple-700" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Maintenance Visit</p>
                              <p className="text-xs text-gray-500">May 5, 2025</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Info className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center">
                            <div className="bg-blue-100 p-2 rounded-full mr-3">
                              <Mail className="h-4 w-4 text-blue-700" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Email Sent</p>
                              <p className="text-xs text-gray-500">Apr 28, 2025</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Info className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="equipment" className="h-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium">Customer Equipment</h3>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Equipment
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {selectedContact.equipment.length === 0 ? (
                        <div className="text-center p-8 border border-dashed rounded-md">
                          <p className="text-gray-500">No equipment registered yet</p>
                        </div>
                      ) : (
                        selectedContact.equipment.map(equipment => (
                          <Card key={equipment.id}>
                            <CardHeader className="pb-2">
                              <div className="flex justify-between">
                                <div>
                                  <CardTitle className="text-base">{equipment.type}</CardTitle>
                                  <CardDescription className="text-sm">
                                    {equipment.brand} {equipment.model}
                                  </CardDescription>
                                </div>
                                <div>
                                  <Badge variant="outline" className="text-xs">
                                    Installed {equipment.install_year}
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>
                            
                            <CardContent className="pt-2">
                              <div className="text-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <div>
                                    <span className="font-medium text-gray-500">Serial: </span>
                                    {equipment.serial}
                                  </div>
                                  
                                  <div className="text-right">
                                    <Button variant="ghost" size="sm" className="h-7 px-2">
                                      <Edit2 className="h-3.5 w-3.5 mr-1" />
                                      Edit
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-7 px-2 text-red-600 hover:text-red-700">
                                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </TabsContent>
                </CardContent>
              </Card>
            </Tabs>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">Select a contact to view details and equipment</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}