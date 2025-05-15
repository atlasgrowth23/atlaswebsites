import React from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';

import { ContactDetails } from './ContactDetails';
import { ContactEquipment } from './ContactEquipment';
import { ContactServiceHistory } from './ContactServiceHistory';

// Types
import { Contact } from '@/types/contact';

interface Equipment {
  id: string;
  name: string;
  model: string;
  serial: string;
  installed: string;
  last_service: string;
  status: 'active' | 'maintenance' | 'repair_needed' | 'replaced';
}

interface ServiceHistory {
  id: string;
  date: string;
  type: string;
  description: string;
  technician: string;
  cost: string;
}

interface ContactDetailsTabsProps {
  contact: Contact;
  equipment: Equipment[];
  serviceHistory: ServiceHistory[];
  onClose: () => void;
  formatDate: (date: string) => string;
  getInitials: (name: string) => string;
}

export function ContactDetailsTabs({
  contact,
  equipment,
  serviceHistory,
  onClose,
  formatDate,
  getInitials
}: ContactDetailsTabsProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-md overflow-hidden h-full">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center text-gray-600">
              {getInitials(contact.name)}
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-medium text-gray-900">{contact.name}</h2>
              <p className="text-sm text-gray-500">Customer since {formatDate(contact.customer_since)}</p>
            </div>
          </div>
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
            <ContactDetails 
              contact={contact} 
              onClose={onClose}
              formatDate={formatDate}
              getInitials={getInitials}
            />
          </TabsContent>
          
          <TabsContent value="equipment" className="mt-0 p-0">
            <ContactEquipment 
              equipment={equipment}
              formatDate={formatDate}
            />
          </TabsContent>
          
          <TabsContent value="service" className="mt-0 p-0">
            <ContactServiceHistory 
              serviceHistory={serviceHistory}
              formatDate={formatDate}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}