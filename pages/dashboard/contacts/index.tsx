import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  Plus,
  Search,
  SlidersHorizontal
} from 'lucide-react';
import MainLayout from '@/components/dashboard/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ContactTable } from '@/components/dashboard/contacts/ContactTable';
import { ContactDetailsTabs } from '@/components/dashboard/contacts/ContactDetailsTabs';
import { Contact, Equipment, ServiceHistory } from '@/types/contact';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  
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
  
  // Handle contact selection
  const handleSelectContact = (id: string) => {
    setSelectedContactId(id);
  };
  
  // Handle contact panel close
  const handleContactClose = () => {
    setSelectedContactId(null);
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
            <Button className="bg-gray-900 hover:bg-gray-800 h-9">
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
        
        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <ContactTable 
              contacts={contacts}
              loading={loading}
              onSelectContact={handleSelectContact}
              formatDate={formatDate}
              getInitials={getInitials}
            />
          </div>
          
          {/* Contact Detail Side Panel */}
          {selectedContact && (
            <div className="lg:col-span-5">
              <ContactDetailsTabs
                contact={selectedContact}
                equipment={equipmentData}
                serviceHistory={serviceHistoryData}
                onClose={handleContactClose}
                formatDate={formatDate}
                getInitials={getInitials}
              />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}