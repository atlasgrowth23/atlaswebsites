import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  MessageSquare,
  Edit,
  Trash,
  Plus
} from 'lucide-react';

import MainLayout from '@/components/dashboard/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';

import { Contact, Equipment, ServiceHistory } from '@/types/contact';

export default function ContactDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Load contact data
  useEffect(() => {
    if (!id) return;
    
    // Simulate API call to fetch contact details
    setTimeout(() => {
      const mockContact: Contact = {
        id: id as string,
        name: 'John Smith',
        phone: '(555) 123-4567',
        email: 'john.smith@example.com',
        address: '123 Main St, Anytown, CA 95012',
        customer_since: '2020-03-15',
        type: 'residential'
      };
      
      setContact(mockContact);
      setLoading(false);
    }, 500);
  }, [id]);
  
  // Mock equipment data
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
  
  // Go back to contacts list
  const handleBack = () => {
    router.push('/dashboard/contacts');
  };
  
  if (loading) {
    return (
      <MainLayout title="Contact Details">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
        </div>
      </MainLayout>
    );
  }
  
  if (!contact) {
    return (
      <MainLayout title="Contact Details">
        <div className="text-center p-8">
          <p className="text-gray-600">Contact not found.</p>
          <Button onClick={handleBack} className="mt-4">
            Back to Contacts
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Contact Details">
      <Head>
        <title>{contact.name} - HVAC Pro</title>
        <meta name="description" content={`Contact details for ${contact.name}`} />
      </Head>
      
      <div>
        {/* Page header with back button */}
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            className="mr-2 p-2" 
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Contact Details</h1>
            <p className="text-sm text-gray-500">
              View and manage contact information
            </p>
          </div>
        </div>
        
        {/* Contact header */}
        <div className="bg-white border border-gray-200 rounded-md mb-6">
          <div className="p-6 flex flex-wrap md:flex-nowrap justify-between items-start gap-4">
            <div className="flex items-center">
              <div className="h-14 w-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xl">
                {getInitials(contact.name)}
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-medium text-gray-900">{contact.name}</h2>
                <div className="flex flex-wrap items-center mt-1 gap-3">
                  <Badge variant="outline" className="capitalize">
                    {contact.type}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Customer since {formatDate(contact.customer_since)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
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
              <Button size="sm" className="bg-gray-900 hover:bg-gray-800 h-9">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </div>
        
        {/* Tabs navigation */}
        <Tabs defaultValue="details" className="w-full">
          <div className="border-b border-gray-200 mb-6">
            <TabsList className="w-full justify-start bg-transparent p-0 border-0">
              <TabsTrigger 
                value="details" 
                className="text-sm data-[state=active]:border-b-2 data-[state=active]:border-gray-900 data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none py-3 px-6"
              >
                Contact Details
              </TabsTrigger>
              <TabsTrigger 
                value="equipment" 
                className="text-sm data-[state=active]:border-b-2 data-[state=active]:border-gray-900 data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none py-3 px-6"
              >
                Equipment ({equipmentData.length})
              </TabsTrigger>
              <TabsTrigger 
                value="service" 
                className="text-sm data-[state=active]:border-b-2 data-[state=active]:border-gray-900 data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none py-3 px-6"
              >
                Service History
              </TabsTrigger>
              <TabsTrigger 
                value="notes" 
                className="text-sm data-[state=active]:border-b-2 data-[state=active]:border-gray-900 data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none py-3 px-6"
              >
                Notes
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Tab contents */}
          <TabsContent value="details" className="m-0">
            <div className="bg-white border border-gray-200 rounded-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="space-y-6">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Phone</div>
                      <div className="mt-1">
                        <a href={`tel:${contact.phone}`} className="text-gray-900 hover:text-blue-600">
                          {contact.phone}
                        </a>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Email</div>
                      <div className="mt-1">
                        <a href={`mailto:${contact.email}`} className="text-gray-900 hover:text-blue-600">
                          {contact.email}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Address</div>
                  <div className="mt-1">
                    <a 
                      href={`https://maps.google.com/?q=${encodeURIComponent(contact.address)}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-900 hover:text-blue-600 flex items-start"
                    >
                      <MapPin className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0 text-gray-400" />
                      <span>{contact.address}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="equipment" className="m-0">
            <div className="bg-white border border-gray-200 rounded-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Equipment</h3>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Equipment
                </Button>
              </div>
              
              <div className="space-y-6">
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
            </div>
          </TabsContent>
          
          <TabsContent value="service" className="m-0">
            <div className="bg-white border border-gray-200 rounded-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Service History</h3>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </div>
              
              <div className="space-y-6">
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
            </div>
          </TabsContent>
          
          <TabsContent value="notes" className="m-0">
            <div className="bg-white border border-gray-200 rounded-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Notes</h3>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
              
              <div className="text-center py-8 border border-dashed rounded">
                <p className="text-gray-500">No notes available for this contact.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}